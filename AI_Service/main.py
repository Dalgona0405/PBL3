from fastapi.responses import JSONResponse
from fastapi import FastAPI, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from typing import List
from contextlib import asynccontextmanager
from pypdf import PdfReader
import torch
import io
import re

from train import train_gnn
from data_loader import fetch_and_process_data
from model import GCNNet, calculate_score, SalaryRegressor

# --- PHẦN 1: ĐỊNH NGHĨA SCHEMA DỮ LIỆU (PYDANTIC) ---


class SkillRequest(BaseModel):
    """Dữ liệu đầu vào cho API gợi ý kỹ năng liên quan."""
    current_skills: List[int]


class MatchScoreRequest(BaseModel):
    """Dữ liệu đầu vào để tính điểm phù hợp cho một cặp ứng viên - công việc."""
    candidate_skills: List[int]
    job_skills: List[int]


class SkillSalaryData(BaseModel):
    """Mức lương trung bình hiện tại của một kỹ năng từ Backend C#."""
    skill_id: int
    skill_name: str
    current_avg_salary: float


class SalaryForecastRequest(BaseModel):
    """Danh sách kỹ năng cần dự báo xu hướng mức lương."""
    skills: List[SkillSalaryData]


class BatchJobItem(BaseModel):
    """Thông tin một tin tuyển dụng trong yêu cầu chấm điểm hàng loạt."""
    job_id: int
    job_skills: List[int]


class BatchMatchScoreRequest(BaseModel):
    """Dữ liệu đầu vào để tính điểm phù hợp hàng loạt cho nhiều tin tuyển dụng."""
    jobs: List[BatchJobItem]
    candidate_skills: List[int]


# --- PHẦN 2: TRẠNG THÁI TOÀN CỤC VÀ VÒNG ĐỜI HỆ THỐNG ---

graph_data = None
sql_to_idx = {}
idx_to_sql = {}
idx_to_name = {}
model = None
regressor = None
node_embeddings = None


def _load_models_and_graph() -> bool:
    """
    Nạp dữ liệu đồ thị từ Backend C# cùng hai tệp trọng số (gnn_encoder.pth, gnn_regressor.pth),
    đồng thời tính trước vector biểu diễn (node_embeddings) vào RAM để phục vụ suy luận nhanh.
    """
    global graph_data, sql_to_idx, idx_to_sql, idx_to_name, model, regressor, node_embeddings

    fetched_graph, fetched_sql_to_idx, fetched_idx_to_sql, fetched_idx_to_name = fetch_and_process_data()
    if fetched_graph is None or fetched_graph.num_nodes == 0:
        return False

    try:
        loaded_encoder = GCNNet(in_channels=8)
        loaded_encoder.load_state_dict(torch.load("gnn_encoder.pth", map_location=torch.device("cpu")))
        loaded_encoder.eval()

        loaded_regressor = SalaryRegressor(in_channels=16)
        loaded_regressor.load_state_dict(torch.load("gnn_regressor.pth", map_location=torch.device("cpu")))
        loaded_regressor.eval()

        with torch.no_grad():
            computed_embeddings = loaded_encoder(fetched_graph.x, fetched_graph.edge_index)

        graph_data = fetched_graph
        sql_to_idx = fetched_sql_to_idx
        idx_to_sql = fetched_idx_to_sql
        idx_to_name = fetched_idx_to_name
        model = loaded_encoder
        regressor = loaded_regressor
        node_embeddings = computed_embeddings
        return True
    except Exception as e:
        print(f"Failed to load GNN weights into memory: {e}")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Nạp dữ liệu đồ thị và mô hình GNN khi khởi động FastAPI server."""
    print("Loading graph data and GNN models...")
    if _load_models_and_graph():
        print("AI Service initialized successfully.")
    else:
        print("Warning: Graph data or model weights not loaded at startup. Self-healing will retry on demand.")

    yield

    print("Shutting down AI Service and releasing resources...")


app = FastAPI(title="AI Job System: GNN & Analytics", lifespan=lifespan)


def train_and_reload():
    """Huấn luyện lại toàn bộ mô hình GNN từ dữ liệu mới và nạp lại cả encoder lẫn regressor vào RAM."""
    print("Starting GNN retraining...")
    train_gnn()

    print("Reloading updated graph data and model weights into memory...")
    if _load_models_and_graph():
        print("Retrain and model reload completed successfully.")
    else:
        print("Warning: Retraining finished, but failed to reload updated models into memory.")


def ensure_model_loaded() -> bool:
    """
    Cơ chế tự phục hồi (Self-Healing):
    Nếu lúc khởi động container AI mà Backend C# chưa kịp mở cổng, hàm sẽ tự động thử nạp lại
    đồ thị và mô hình ngay khi có request đầu tiên gọi tới.
    """
    if node_embeddings is not None and regressor is not None:
        return True

    print("[Self-Healing] Models not loaded in memory yet. Attempting to fetch data from C# API...")
    loaded = _load_models_and_graph()
    if loaded:
        print("[Self-Healing] Loaded GNN encoder, regressor, and embeddings successfully.")
    return loaded


@app.post("/api/train")
def trigger_ai_training(background_tasks: BackgroundTasks):
    """Kích hoạt tác vụ huấn luyện lại mô hình GNN chạy ngầm (Background Task)."""
    try:
        background_tasks.add_task(train_and_reload)
        return {
            "status": "success",
            "message": "Command received! AI is training in the background. Please check logs for progress. This may take a few minutes."
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error occurred while initializing AI: {str(e)}"})


# --- PHẦN 3: API GỢI Ý KỸ NĂNG & ĐỒ THỊ (GNN) ---


@app.post("/api/predict")
def predict_skills(request: SkillRequest):
    """Gợi ý tối đa 3 kỹ năng liên quan chặt chẽ nhất với bộ kỹ năng hiện tại dựa trên Cosine Similarity."""
    if not ensure_model_loaded():
        return JSONResponse(status_code=400, content={"status": "error", "message": "GNN models have not been loaded. Please run train.py first."})

    current_indices = [sql_to_idx[s] for s in request.current_skills if s in sql_to_idx]
    if not current_indices:
        return {"status": "success", "suggestions": []}

    suggestions = []
    for target_idx in range(len(idx_to_sql)):
        if target_idx in current_indices:
            continue

        max_score = 0.0
        for src_idx in current_indices:
            score = calculate_score(node_embeddings, src_idx, target_idx)
            max_score = max(max_score, score)

        # Chỉ giữ lại các kỹ năng có độ tương đồng vượt ngưỡng tin cậy 50%
        if max_score > 0.5:
            suggestions.append({
                "skill_id": idx_to_sql[target_idx],
                "skill_name": idx_to_name[target_idx],
                "score": round(max_score * 100, 2)
            })

    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return {"status": "success", "suggestions": suggestions[:3]}


@app.get("/api/health")
def health_check():
    """Kiểm tra trạng thái hoạt động và tình trạng nạp mô hình trong RAM của AI Service."""
    return {
        "status": "online",
        "model_loaded": node_embeddings is not None,
        "nodes_count": len(sql_to_idx) if sql_to_idx else 0
    }


@app.get("/api/graph/predict-edges")
def get_predicted_edges():
    """Trả về các liên kết kỹ năng tiềm ẩn được GNN dự đoán (ngưỡng tương đồng > 0.6) để vẽ đồ thị."""
    try:
        if not ensure_model_loaded():
            return JSONResponse(status_code=400, content={"message": "GNN models have not been loaded. Please run train.py first."})

        predicted_edges = []
        for i in range(len(idx_to_sql)):
            for j in range(i + 1, len(idx_to_sql)):
                score = calculate_score(node_embeddings, i, j)
                if score > 0.6:
                    predicted_edges.append({
                        "from": idx_to_sql[i],
                        "to": idx_to_sql[j],
                        "strength": int(score * 100),
                        "value": round(score * 100, 2)
                    })
        return predicted_edges
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error occurred while predicting edges: {str(e)}"})

# --- PHẦN 4: API TÍNH ĐIỂM MATCHING (GNN) ---


def _compute_job_match_result(candidate_indices: List[int], job_skills: List[int]) -> dict:
    """
    Tính điểm phù hợp kỹ năng cho một tin tuyển dụng dựa trên tập chỉ số kỹ năng của ứng viên.
    Kỹ năng khớp chính xác được +1.0 điểm; kỹ năng gần nghĩa (Cosine > 0.75) được +0.5 điểm.
    """
    job_indices = [sql_to_idx[s] for s in job_skills if s in sql_to_idx]

    if not job_indices:
        return {
            "matchScore": 100.0,
            "missingSkills": [],
            "advice": "Công việc này không yêu cầu kỹ năng cụ thể nào, bạn đã hoàn toàn phù hợp!"
        }

    total_score = 0.0
    exact_match_count = 0
    missing_skills_names = []

    for j_idx in job_indices:
        if j_idx in candidate_indices:
            total_score += 1.0
            exact_match_count += 1
        else:
            missing_skills_names.append(idx_to_name.get(j_idx, "Unknown Skill"))
            max_sim = max(
                (calculate_score(node_embeddings, c_idx, j_idx) for c_idx in candidate_indices),
                default=0.0
            )
            if max_sim > 0.75:
                total_score += 0.5

    # Chốt chặn an toàn: nếu ứng viên không trùng khớp kỹ năng gốc nào, giảm 70% điểm vớt vát để tránh lệch ngành
    if exact_match_count == 0 and len(job_indices) > 0:
        total_score *= 0.3

    match_score = round((total_score / len(job_indices)) * 100, 1)
    if not missing_skills_names:
        advice = "Tuyệt vời! Bạn đã có tất cả kỹ năng cần thiết cho công việc này."
    else:
        top_missing = ", ".join(missing_skills_names[:3])
        advice = f"Bạn cần học thêm các kỹ năng: {top_missing} để tăng cơ hội trúng tuyển."

    return {
        "matchScore": match_score,
        "missingSkills": missing_skills_names,
        "advice": advice
    }


@app.post("/api/matching/score")
def get_matching_score(request: MatchScoreRequest):
    """Tính điểm phù hợp kỹ năng giữa một ứng viên và một tin tuyển dụng."""
    if not ensure_model_loaded():
        return JSONResponse(status_code=400, content={"message": "GNN models have not been loaded. Please run train.py first."})

    try:
        candidate_indices = [sql_to_idx[s] for s in request.candidate_skills if s in sql_to_idx]
        return _compute_job_match_result(candidate_indices, request.job_skills)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error occurred while calculating AI score: {str(e)}"})


@app.post("/api/matching/batch-score")
def get_batch_matching_score(request: BatchMatchScoreRequest):
    """Tính điểm GNN cho hàng trăm công việc trong 1 HTTP Request duy nhất nhằm tránh lỗi N+1 request."""
    if not ensure_model_loaded():
        return JSONResponse(status_code=400, content={"message": "GNN models have not been loaded."})

    try:
        candidate_indices = [sql_to_idx[s] for s in request.candidate_skills if s in sql_to_idx]
        return {
            str(job_item.job_id): _compute_job_match_result(candidate_indices, job_item.job_skills)
            for job_item in request.jobs
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


# --- PHẦN 5: API DỰ BÁO LƯƠNG (HYBRID FORECAST) ---


@app.post("/api/analytics/salary-forecast")
def forecast_salary(request: SalaryForecastRequest):
    """Ước lượng biên độ tăng trưởng lương tiềm năng (0% - 20%) dựa trên điểm hồi quy từ GNN embeddings."""
    if not ensure_model_loaded() or graph_data is None or node_embeddings is None or regressor is None:
        return JSONResponse(status_code=400, content={"message": "Graph data or GNN models have not been loaded. Please run train.py first."})

    try:
        with torch.no_grad():
            potentials = regressor(node_embeddings).squeeze(-1).tolist()

        if not potentials:
            return {"status": "success", "forecast": []}

        # Chuẩn hóa điểm tiềm năng về đoạn [0, 1] trên toàn bộ đồ thị
        min_p = min(potentials)
        max_p = max(potentials)
        range_p = (max_p - min_p) if (max_p - min_p) > 0 else 1.0

        results = []
        for item in request.skills:
            idx = sql_to_idx.get(item.skill_id)
            if idx is not None:
                potential = (potentials[idx] - min_p) / range_p
                growth_rate = potential * 0.20
            else:
                # Kỹ năng mới chưa có trên đồ thị dùng mức tăng trưởng mặc định 5%
                growth_rate = 0.05

            forecasted_salary = item.current_avg_salary * (1 + growth_rate)
            results.append({
                "skill_id": item.skill_id,
                "skill_name": item.skill_name,
                "current_salary": round(item.current_avg_salary, 1),
                "forecasted_salary": round(forecasted_salary, 1),
                "growth_percent": round(growth_rate * 100, 1)
            })

        results.sort(key=lambda x: x["growth_percent"], reverse=True)
        return {"status": "success", "forecast": results}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error during AI salary forecasting: {str(e)}"})


# --- PHẦN 6: BÓC TÁCH PDF CV SANG JSON ---

_CV_HEADER_KEYWORDS = (
    "cv",
    "curriculum vitae",
    "resume",
    "sơ yếu lý lịch",
    "thông tin cá nhân",
    "profile"
)


def _extract_candidate_name(lines: List[str]) -> str:
    """
    Tìm dòng chứa họ tên ứng viên trong 5 dòng đầu của CV,
    bỏ qua các dòng tiêu đề tài liệu (CV, Resume...) hoặc dòng chứa email/số điện thoại.
    """
    if not lines:
        return ""

    selected_line = lines[0]
    for line in lines[:5]:
        normalized = re.sub(r"[:\-–_|]+", " ", line).strip().lower()
        if normalized in _CV_HEADER_KEYWORDS or any(
            normalized.startswith(f"{kw} ") for kw in _CV_HEADER_KEYWORDS
        ):
            continue
        if "@" in line or "http" in normalized or "linkedin" in normalized or "github" in normalized:
            continue
        if re.search(r"(?:\+84|0)\s*[35789](?:[\s.-]*\d){8}\b", line):
            continue

        selected_line = line
        break

    # Xử lý trường hợp chữ bị dính liền khi xuất PDF (VD: "Nguyễn VănCường" -> "Nguyễn Văn Cường")
    return re.sub(
        r"([a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ])"
        r"([A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ])",
        r"\1 \2",
        selected_line
    )


@app.post("/api/cv/parse")
async def parse_resume_pdf(file: UploadFile = File(...)):
    """Bóc tách nội dung văn bản và các trường thông tin cơ bản từ tệp CV PDF sang JSON cho Backend C#."""
    try:
        max_bytes = 5 * 1024 * 1024
        pdf_bytes = await file.read(max_bytes + 1)
        if len(pdf_bytes) > max_bytes:
            return JSONResponse(status_code=400, content={"error": "The PDF file size has exceeded the 5MB."})

        reader = PdfReader(io.BytesIO(pdf_bytes))

        raw_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                raw_text += page_text + "\n"

        if not raw_text.strip():
            return JSONResponse(status_code=400, content={"error": "No text found in the PDF file."})

        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]

        email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", raw_text)
        phone_match = re.search(r"(?:\+84|0)\s*[35789](?:[\s.-]*\d){8}\b", raw_text)

        dob_match = re.search(r"(\d{2}/\d{2}/\d{4})", raw_text)
        gender = None
        if re.search(r"Giới tính:\s*Nam|\bMale\b", raw_text, re.IGNORECASE):
            gender = "Nam"
        elif re.search(r"Giới tính:\s*Nữ|\bFemale\b", raw_text, re.IGNORECASE):
            gender = "Nữ"

        full_name = _extract_candidate_name(lines)

        address_parts = []
        for line in lines[:12]:
            if any(k in line for k in ["Quận", "Huyện", "TP.", "Thành phố", "Đà Nẵng", "Hà Nội", "Hồ Chí Minh", "Address"]):
                address_parts.append(line)
        address = ", ".join(address_parts) if address_parts else None

        experiences = []
        exp_section_match = re.search(
            r"(?:Kinh nghiệm làm việc|Work Experience|Experience)(.*?)(?:Học vấn|Education|Dự án|Projects|Chứng chỉ|$)",
            raw_text,
            re.IGNORECASE | re.DOTALL
        )
        if exp_section_match:
            exp_block = exp_section_match.group(1).strip()
            date_pattern = re.compile(r"(\d{2}/\d{4}|\d{4})\s*[–\-~]\s*(\d{2}/\d{4}|\d{4}|Hiện tại|Present|Now)", re.IGNORECASE)
            matches = list(date_pattern.finditer(exp_block))

            for idx, m in enumerate(matches):
                start_str = m.group(1)
                end_str = m.group(2)
                block_start = m.end()
                block_end = matches[idx + 1].start() if idx + 1 < len(matches) else len(exp_block)
                detail_text = exp_block[block_start:block_end].strip()
                detail_lines = [l.strip() for l in detail_text.splitlines() if l.strip()]

                job_title = "Software Developer"
                company_name = "Doanh nghiệp"
                description = detail_text

                if detail_lines:
                    header_line = detail_lines[0]
                    if "," in header_line:
                        parts = [p.strip() for p in header_line.split(",")]
                        job_title = parts[0]
                        company_name = ", ".join(parts[1:])
                    else:
                        job_title = header_line
                    description = "\n".join(detail_lines[1:]) if len(detail_lines) > 1 else header_line

                experiences.append({
                    "jobTitle": job_title,
                    "companyName": company_name,
                    "startDateRaw": start_str,
                    "endDateRaw": end_str,
                    "description": description
                })

        education_summary = None
        edu_match = re.search(r"(?:Học vấn|Education)(.*?)(?:Chứng chỉ|Giải thưởng|Hoạt động|$)", raw_text, re.IGNORECASE | re.DOTALL)
        if edu_match:
            education_summary = " ".join(edu_match.group(1).strip().split())

        return {
            "fullName": full_name,
            "email": email_match.group(0) if email_match else None,
            "phone": re.sub(r"[^\d+]", "", phone_match.group(0)) if phone_match else None,
            "birthdayRaw": dob_match.group(1) if dob_match else None,
            "gender": gender,
            "address": address,
            "education": education_summary,
            "experiences": experiences,
            "rawText": raw_text
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Failed to parse PDF: {str(e)}"})