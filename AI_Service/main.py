from fastapi.responses import JSONResponse
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import torch

# CHÚ Ý: Sử dụng GCNNet từ model.py và logic từ data_loader.py
from data_loader import fetch_and_process_data 
from model import GCNNet, calculate_score 

app = FastAPI(title="AI Job System: GNN & Analytics")

# --- PHẦN 1: ĐỊNH NGHĨA MODEL DỮ LIỆU (PYDANTIC) ---

# Model cho Analytics Lương
class JobSalaryData(BaseModel):
    salary_min: float = 0
    salary_max: float = 0

class SalaryChartRequest(BaseModel):
    jobs: List[JobSalaryData]

# Model cho Gợi ý Kỹ năng[cite: 1, 2]
class SkillRequest(BaseModel):
    current_skills: List[int]

class MatchScoreRequest(BaseModel):
    candidate_skills: List[int]
    job_skills: List[int]

# --- PHẦN 2: BIẾN TOÀN CỤC VÀ KHỞI TẠO HỆ THỐNG ---

graph_data = None
sql_to_idx = {}
idx_to_sql = {}
idx_to_name = {}
model = None
node_embeddings = None

@app.on_event("startup")
def load_system():
    global graph_data, sql_to_idx, idx_to_sql, idx_to_name, model, node_embeddings
    
    # Tải dữ liệu đồ thị từ PostgreSQL thông qua data_loader[cite: 1, 2]
    graph_data, sql_to_idx, idx_to_sql, idx_to_name = fetch_and_process_data()
    
    if graph_data is not None:
        # Khởi tạo GCNNet (đảm bảo file model.py của bạn dùng tên class này)
        model = GCNNet(in_channels=1) 
        
        # Load trọng số nếu bạn đã có file train (bỏ comment dòng dưới nếu cần)
        model.load_state_dict(torch.load('gnn_encoder.pth'))
        
        model.eval() 
        with torch.no_grad():
            # Tạo bộ Embeddings cho toàn bộ kỹ năng ngay khi khởi động[cite: 1, 2]
            node_embeddings = model(graph_data.x, graph_data.edge_index)
        print("🚀 Hệ thống AI (GNN & Analytics) đã sẵn sàng!")

# --- PHẦN 3: API PHÂN TÍCH BIỂU ĐỒ LƯƠNG ---

@app.post("/api/analytics/salary-chart")
def generate_salary_chart(request: SalaryChartRequest):
    categories = {
        "negotiable": 0, "under_10": 0, "10_to_20": 0,
        "20_to_30": 0, "30_to_50": 0, "over_50": 0
    }
    
    for job in request.jobs:
        min_sal = job.salary_min or 0
        max_sal = job.salary_max or 0
        
        if min_sal == 0 and max_sal == 0:
            categories["negotiable"] += 1
            continue
            
        # Tính mức lương đại diện (trung bình cộng)[cite: 2]
        ref_salary = (min_sal + max_sal) / 2 if (min_sal > 0 and max_sal > 0) else max(min_sal, max_sal)
        
        # Phân loại vào ma trận tần suất[cite: 2]
        if ref_salary < 10: categories["under_10"] += 1
        elif 10 <= ref_salary < 20: categories["10_to_20"] += 1
        elif 20 <= ref_salary < 30: categories["20_to_30"] += 1
        elif 30 <= ref_salary <= 50: categories["30_to_50"] += 1
        else: categories["over_50"] += 1
            
    # Trả về cấu trúc mảng cho Recharts (Frontend)[cite: 2]
    chart_data = [
        {"label": "Lương thỏa thuận", "value": categories["negotiable"]},
        {"label": "Dưới 10 Triệu", "value": categories["under_10"]},
        {"label": "10 - 20 Triệu", "value": categories["10_to_20"]},
        {"label": "20 - 30 Triệu", "value": categories["20_to_30"]},
        {"label": "30 - 50 Triệu", "value": categories["30_to_50"]},
        {"label": "Trên 50 Triệu", "value": categories["over_50"]}
    ]
    return {"status": "success", "chart_data": chart_data}

# --- PHẦN 4: API GỢI Ý KỸ NĂNG (GNN) ---

@app.post("/api/predict")
def predict_skills(request: SkillRequest):
    if node_embeddings is None:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Model GNN chưa sẵn sàng."})
    
    # Chuyển đổi ID từ SQL sang Index của đồ thị[cite: 1, 2]
    current_indices = [sql_to_idx[s] for s in request.current_skills if s in sql_to_idx]
    
    if not current_indices:
        return {"status": "success", "suggestions": []}

    suggestions = []
    # Tính toán độ tương đồng giữa kỹ năng hiện tại và các kỹ năng khác trong đồ thị[cite: 1]
    for target_idx in range(len(idx_to_sql)):
        if target_idx in current_indices: 
            continue
            
        max_score = 0
        for src_idx in current_indices:
            score = calculate_score(node_embeddings, src_idx, target_idx)
            max_score = max(max_score, score)
                
        if max_score > 0.5: # Ngưỡng tin cậy 50%[cite: 1, 2]
            suggestions.append({
                "skill_id": idx_to_sql[target_idx],
                "skill_name": idx_to_name[target_idx],
                "score": round(max_score * 100, 2)
            })
            
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return {"status": "success", "suggestions": suggestions[:3]}

# 1. API Health Check (Kiểm tra sức khỏe hệ thống)
@app.get("/api/health")
def health_check():
    return{
        "status": "online", 
        "model_loaded": node_embeddings is not None,
        "nodes_count": len(sql_to_idx) if sql_to_idx else 0
    }
# 2. Bọc try-except cho API dự báo kỹ năng để xử lý lỗi không mong muốn
@app.get("/api/graph/predict-edges")
def get_predicted_edges():
    try:
        if node_embeddings is None:
            # Trả về 400 Bad Request nếu model chưa train, thay vì để sập
            return JSONResponse(status_code=400, content={"message": "Model GNN chưa được nạp. Vui lòng chạy train.py trước."})
        
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
        return JSONResponse(status_code=500, content={"error": f"Lỗi khi dự đoán cạnh: {str(e)}"})
    
@app.post("/api/matching/score")
def get_matching_score(request: MatchScoreRequest):
    if node_embeddings is None:
        return JSONResponse(status_code=400, content={"message": "Model GNN chưa được nạp. Vui lòng chạy train.py trước."})
    
    try:
        candidate_skills = request.candidate_skills
        job_skills = request.job_skills

        candidate_indices = [sql_to_idx[s] for s in candidate_skills if s in sql_to_idx]
        job_indices = [sql_to_idx[s] for s in job_skills if s in sql_to_idx]

        if not job_indices:
            return{
                "matchScore": 100.0,
                "missingSkills": [],
                "advice": "Công việc này không yêu cầu kỹ năng cụ thể nào, bạn đã hoàn toàn phù hợp!"
            }
        
        total_score = 0
        missing_skills_names = []

        for j_idx in job_indices:
            if j_idx in candidate_indices:
                total_score += 1.0
            else:
                max_sim = 0
            total_score += max_sim
            if max_sim < 0.5:
                missing_skills_names.append(idx_to_name.get(j_idx, "Unknown Skill"))
        
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
    
    except Exception as e:
        # Bắt mọi lỗi thuật toán và trả về 500 kèm thông báo rõ ràng cho C# đọc
        return JSONResponse(status_code=500, content={"error": f"Lỗi tính toán AI: {str(e)}"})