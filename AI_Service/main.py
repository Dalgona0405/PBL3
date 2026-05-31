from fastapi.responses import JSONResponse
from fastapi import FastAPI
from fastapi import BackgroundTasks
from train import train_gnn
from model import GCNNet
from pydantic import BaseModel
from typing import List
from contextlib import asynccontextmanager
import torch

# CHÚ Ý: Sử dụng GCNNet từ model.py và logic từ data_loader.py
from data_loader import fetch_and_process_data 
from model import GCNNet, calculate_score, SalaryRegressor 

# --- PHẦN 1: ĐỊNH NGHĨA MODEL DỮ LIỆU (PYDANTIC) ---

# Model cho Gợi ý Kỹ năng[cite: 1, 2]
class SkillRequest(BaseModel):
    current_skills: List[int]

# Model cho Tính điểm Matching giữa Candidate và Job[cite: 1, 2]
class MatchScoreRequest(BaseModel):
    candidate_skills: List[int]
    job_skills: List[int]

# Model cho Dự báo lương theo Kỹ năng
class SkillSalaryData(BaseModel):
    skill_id: int
    skill_name: str
    current_avg_salary: float # Lương trung bình hiện tại (triệu VNĐ)

class SalaryForecastRequest(BaseModel):
    skills: List[SkillSalaryData]


# --- PHẦN 2: BIẾN TOÀN CỤC VÀ KHỞI TẠO HỆ THỐNG ---

graph_data = None
sql_to_idx = {}
idx_to_sql = {}
idx_to_name = {}
model = None
regressor = None
node_embeddings = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph_data, sql_to_idx, idx_to_sql, idx_to_name, model, regressor, node_embeddings
    
    print("⏳ Loading graph data and AI model...")
    graph_data, sql_to_idx, idx_to_sql, idx_to_name = fetch_and_process_data()
    
    if graph_data is not None:
        model = GCNNet(in_channels=6) 
        model.load_state_dict(torch.load('gnn_encoder.pth'))
        model.eval() 
        
        regressor = SalaryRegressor(in_channels=16)
        regressor.load_state_dict(torch.load('gnn_regressor.pth'))
        regressor.eval()
        
        with torch.no_grad():
            node_embeddings = model(graph_data.x, graph_data.edge_index)
        print("🚀 System initialized successfully!")
        
    yield  # Server sẽ dừng ở đây và bắt đầu phục vụ các API request
    
    print("🛑 Cleaning up resources...")
    # (Hiện tại AI của mình chưa cần dọn dẹp gì phức tạp, nên chỉ cần in ra log)

app = FastAPI(title="AI Job System: GNN & Analytics", lifespan=lifespan)

# 1. Viết 1 hàm nhỏ để anh bồi bàn đọc lại sách mới
def train_and_reload():
    global node_embeddings, model, graph_data, sql_to_idx, idx_to_sql, idx_to_name
    
    print("⏳ AI is starting to retrain...")
    # Gọi hàm train (lưu xuống ổ cứng)
    train_gnn() 
    
    print("🔄 Updating knowledge in RAM...")
    # Đọc lại data và model mới nhất
    graph_data, sql_to_idx, idx_to_sql, idx_to_name = fetch_and_process_data()
    if graph_data is not None:
        model = GCNNet(in_channels=1)
        model.load_state_dict(torch.load('gnn_encoder.pth'))
        model.eval()
        with torch.no_grad():
            node_embeddings = model(graph_data.x, graph_data.edge_index)
        print("✅ Update completed! Ready to serve.")

# 2. Sửa lại API để gọi hàm mới này
@app.post("/api/train")
def trigger_ai_training(background_tasks: BackgroundTasks):
    try:
        # Thay vì gọi train_gnn, mình gọi train_and_reload
        background_tasks.add_task(train_and_reload) 
        
        return {
            "status": "success", 
            "message": "Command received! AI is training in the background. Please check logs for progress. This may take a few minutes."
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error occurred while initializing AI: {str(e)}"})

# --- PHẦN 3: API GỢI Ý KỸ NĂNG (GNN) ---

@app.post("/api/predict")
def predict_skills(request: SkillRequest):
    if node_embeddings is None:
        return JSONResponse(status_code=400, content={"status": "error", "message": "Model GNN have not been loaded. Please run train.py first."})
    
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
            return JSONResponse(status_code=400, content={"message": "Model GNN have not been loaded. Please run train.py first."})
        
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

# -- PHẦN 4: API TÍNH ĐIỂM MATCHING (GNN) ---    
@app.post("/api/matching/score")
def get_matching_score(request: MatchScoreRequest):
    if node_embeddings is None:
        return JSONResponse(status_code=400, content={"message": "Model GNN have not been loaded. Please run train.py first."})
    
    try:
        print(f"👉 C# gửi sang - Candidate Skills: {request.candidate_skills}")
        print(f"👉 C# gửi sang - Job Skills: {request.job_skills}")

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
                # 1. Chắc chắn là thiếu kỹ năng này rồi, ghi vào danh sách luôn!
                missing_skills_names.append(idx_to_name.get(j_idx, "Unknown Skill"))
                
                # 2. Nhờ AI tìm xem có kỹ năng nào tương đồng để "vớt vát" điểm số không
                max_sim = 0.0
                for c_idx in candidate_indices:
                    sim_score = calculate_score(node_embeddings, c_idx, j_idx)
                    if sim_score > max_sim:
                        max_sim = sim_score
                
                total_score += max_sim
        
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
        return JSONResponse(status_code=500, content={"error": f"Error occurred while calculating AI score: {str(e)}"})
    
# --- PHẦN 5: API DỰ BÁO LƯƠNG (HYBRID FORECAST) ---

@app.post("/api/analytics/salary-forecast")
def forecast_salary(request: SalaryForecastRequest):
    if graph_data is None or node_embeddings is None or regressor is None:
        return JSONResponse(status_code=400, content={"message": "Graph data or GNN models have not been loaded. Please run train.py first."})
    
    try:
        with torch.no_grad():
            # Sử dụng MLP regressor để tính toán điểm tiềm năng lương cho toàn bộ các nút kỹ năng
            potentials = regressor(node_embeddings).squeeze().tolist()
            
        # Chuẩn hóa các điểm tiềm năng về khoảng [0, 1] trên toàn bộ đồ thị
        min_p = min(potentials)
        max_p = max(potentials)
        range_p = (max_p - min_p) if (max_p - min_p) > 0 else 1.0
        
        results = []
        
        for item in request.skills:
            idx = sql_to_idx.get(item.skill_id)
            
            if idx is not None:
                # Tính độ tăng trưởng dựa trên điểm tiềm năng từ GNN nhúng
                potential = (potentials[idx] - min_p) / range_p
                growth_rate = potential * 0.20 # Tối đa 20%
            else:
                # Nếu kỹ năng quá mới, chưa có trên bản đồ -> Tăng trưởng mặc định 5%
                growth_rate = 0.05
                
            # Tính lương dự báo
            forecasted_salary = item.current_avg_salary * (1 + growth_rate)
            
            results.append({
                "skill_id": item.skill_id,
                "skill_name": item.skill_name,
                "current_salary": round(item.current_avg_salary, 1),
                "forecasted_salary": round(forecasted_salary, 1),
                "growth_percent": round(growth_rate * 100, 1) # Trả về % tăng trưởng để vẽ biểu đồ
            })
            
        # Sắp xếp từ tăng trưởng cao nhất xuống thấp nhất
        results.sort(key=lambda x: x["growth_percent"], reverse=True)
        
        return {"status": "success", "forecast": results}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Error during AI salary forecasting: {str(e)}"})