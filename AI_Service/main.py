from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
import torch
from data_loader import fetch_and_process_data
from model import GCNEncoder, calculate_score

app = FastAPI(title="AI Skill Suggestion")

# Biến toàn cục lưu trữ State
graph_data = None
sql_to_idx = {}
idx_to_sql = {}
idx_to_name = {}
model = None
node_embeddings = None

class SkillRequest(BaseModel):
    current_skills: List[int] # Nhận mảng ID của SQL

@app.on_event("startup")
def load_system():
    global graph_data, sql_to_idx, idx_to_sql, idx_to_name, model, node_embeddings
    graph_data, sql_to_idx, idx_to_sql, idx_to_name = fetch_and_process_data()
    
    if graph_data is not None:
        # Khởi tạo model. (Nếu đã train, bạn dùng torch.load() ở đây)
        model = GCNEncoder(in_channels=1)
        model.eval() # Chuyển sang chế độ Inference (Suy luận)
        
        with torch.no_grad():
            # Tạo sẵn bộ Embeddings Z cho toàn bộ bản đồ kỹ năng
            node_embeddings = model(graph_data.x, graph_data.edge_index)
        print("Trí tuệ AI đã sẵn sàng!")

@app.post("/api/predict")
def predict_skills(request: SkillRequest):
    if node_embeddings is None:
        return {"status": "error", "message": "Model chưa sẵn sàng."}
        
    current_sql_ids = request.current_skills
    # Đổi SQL ID sang GNN Index
    current_indices = [sql_to_idx[s] for s in current_sql_ids if s in sql_to_idx]
    
    if not current_indices:
        return {"status": "success", "suggestions": []}

    suggestions = []
    # Quét tất cả các nút trong đồ thị
    for target_idx in range(len(idx_to_sql)):
        if target_idx in current_indices:
            continue # Bỏ qua kỹ năng đã biết
            
        max_score = 0
        # Thử ghép từng kỹ năng đã biết với kỹ năng mục tiêu này
        for src_idx in current_indices:
            score = calculate_score(node_embeddings, src_idx, target_idx)
            if score > max_score:
                max_score = score
                
        if max_score > 0.5: # Ngưỡng tự tin 50%
            suggestions.append({
                "skill_id": idx_to_sql[target_idx], # Trả ngược lại ID chuẩn của SQL Server
                "skill_name": idx_to_name[target_idx],
                "score": round(max_score * 100, 2)
            })
            
    # Lấy Top 3 gợi ý tốt nhất
    suggestions.sort(key=lambda x: x["score"], reverse=True)
    return {
        "status": "success",
        "suggestions": suggestions[:3]
    }