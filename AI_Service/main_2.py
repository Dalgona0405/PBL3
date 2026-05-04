from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import torch

# CHÚ Ý: Đổi import sang các file _2 và dùng đúng tên GCNNet[cite: 10, 12]
from data_loader import fetch_and_process_data 
from model import GCNNet, calculate_score 

app = FastAPI(title="AI Skill Suggestion & Analytics")

# --- PHẦN 1: MODELS CHO BIỂU ĐỒ LƯƠNG ---
class JobSalaryData(BaseModel):
    salary_min: float = 0
    salary_max: float = 0

class SalaryChartRequest(BaseModel):
    jobs: List[JobSalaryData]

# --- PHẦN 2: MODELS CHO GỢI Ý KỸ NĂNG (GNN) ---
class SkillRequest(BaseModel):
    current_skills: List[int]

# Biến toàn cục
graph_data = None
sql_to_idx = {}
idx_to_sql = {}
idx_to_name = {}
model = None
node_embeddings = None

@app.on_event("startup")
def load_system():
    global graph_data, sql_to_idx, idx_to_sql, idx_to_name, model, node_embeddings
    # Gọi hàm từ data_loader_2[cite: 10]
    graph_data, sql_to_idx, idx_to_sql, idx_to_name = fetch_and_process_data()
    
    if graph_data is not None:
        # Sử dụng GCNNet thay vì GCNEncoder để khớp với model_2.py[cite: 12]
        model = GCNNet(in_channels=1) 
        # model.load_state_dict(torch.load('gnn_encoder.pth')) # Mở ra nếu đã train xong
        model.eval() 
        
        with torch.no_grad():
            node_embeddings = model(graph_data.x, graph_data.edge_index)
        print("🚀 Hệ thống AI (GNN & Analytics) đã sẵn sàng!")

# --- PHẦN 3: API XỬ LÝ BIỂU ĐỒ LƯƠNG ---
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
            
        ref_salary = (min_sal + max_sal) / 2 if (min_sal > 0 and max_sal > 0) else max(min_sal, max_sal)
        
        if ref_salary < 10: categories["under_10"] += 1
        elif 10 <= ref_salary < 20: categories["10_to_20"] += 1
        elif 20 <= ref_salary < 30: categories["20_to_30"] += 1
        elif 30 <= ref_salary <= 50: categories["30_to_50"] += 1
        else: categories["over_50"] += 1
            
    chart_data = [
        {"label": "Lương thỏa thuận", "value": categories["negotiable"]},
        {"label": "Dưới 10 Triệu", "value": categories["under_10"]},
        {"label": "10 - 20 Triệu", "value": categories["10_to_20"]},
        {"label": "20 - 30 Triệu", "value": categories["20_to_30"]},
        {"label": "30 - 50 Triệu", "value": categories["30_to_50"]},
        {"label": "Trên 50 Triệu", "value": categories["over_50"]}
    ]
    return {"status": "success", "chart_data": chart_data}

# --- PHẦN 4: API GỢI Ý KỸ NĂNG ---
@app.post("/api/predict")
def predict_skills(request: SkillRequest):
    if node_embeddings is None:
        return {"status": "error", "message": "Model chưa sẵn sàng."}
    
    current_indices = [sql_to_idx[s] for s in request.current_skills if s in sql_to_idx]
    if not current_indices:
        return {"status": "success", "suggestions": []}

    suggestions = []
    for target_idx in range(len(idx_to_sql)):
        if target_idx in current_indices: continue
            
        max_score = 0
        for src_idx in current_indices:
            score = calculate_score(node_embeddings, src_idx, target_idx)
            max_score = max(max_score, score)
                
        if max_score > 0.5:
            suggestions.append({
                "skill_id": idx_to_sql[target_idx],
                "skill_name": idx_to_name[target_idx],
                "score": round(max_score * 100, 2)
            })
            
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return {"status": "success", "suggestions": suggestions[:3]}