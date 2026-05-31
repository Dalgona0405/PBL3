import os
import torch
import requests
from torch_geometric.data import Data

# Lấy URL từ biến môi trường, nếu không có thì mặc định dùng localhost:5000
# Mẹo: Sau này có thể tạo file .env để chứa biến CSHARP_API_URL này
CSHARP_API_URL = os.getenv("CSHARP_API_URL", "http://localhost:5000")

def fetch_and_process_data(limit=200):
    # Nối URL linh hoạt thay vì gán cứng
    api_url = f"{CSHARP_API_URL}/api/reports/graph-skills?limit={limit}"
    
    try:
        print(f"👉 Đang kéo dữ liệu từ C#: {api_url}")
        response = requests.get(api_url)
        response.raise_for_status()
        raw_data = response.json()
        
        raw_nodes = raw_data.get('nodes', [])
        raw_edges = raw_data.get('edges', [])
        
        # 1. BỘ ÁNH XẠ ID (SQL <-> GNN Index)
        sql_to_idx = {}
        idx_to_sql = {}
        idx_to_name = {}
        
        for idx, node in enumerate(raw_nodes):
            sql_id = node.get('id') or node.get("Id")
            sql_to_idx[sql_id] = idx
            idx_to_sql[idx] = sql_id
            idx_to_name[idx] = node.get('label', f"Skill_{sql_id}")
            
        num_nodes = len(raw_nodes)
        
        # 2. TẠO EDGE INDEX & TÍNH NODE DEGREE (Dùng cho Ma trận X)
        src_indices = []
        tgt_indices = []
        node_degrees = [1.0] * num_nodes
        
        for edge in raw_edges:
            src_sql, tgt_sql = edge['from'], edge['to']
            if src_sql in sql_to_idx and tgt_sql in sql_to_idx:
                src_idx = sql_to_idx[src_sql]
                tgt_idx = sql_to_idx[tgt_sql]
                
                src_indices.append(src_idx)
                tgt_indices.append(tgt_idx)
                
                node_degrees[src_idx] += 1.0
                node_degrees[tgt_idx] += 1.0
                
        edge_index = torch.tensor([src_indices, tgt_indices], dtype=torch.long)

        # 3. MA TRẬN ĐẶC TRƯNG X ĐA CHIỀU (6 FEATURES)
        features = []
        max_salary = max([n.get('currentAvgSalary') or n.get('CurrentAvgSalary') or 0.0 for n in raw_nodes]) or 1.0
        max_jobs = max([n.get('jobCount') or n.get('JobCount') or 0.0 for n in raw_nodes]) or 1.0
        max_size = max([n.get('size') or n.get('Size') or 0.0 for n in raw_nodes]) or 1.0
        max_deg = max(node_degrees) or 1.0
        
        for idx in range(num_nodes):
            node = raw_nodes[idx]
            salary_val = node.get('currentAvgSalary') or node.get('CurrentAvgSalary') or 0.0
            jobs_val = node.get('jobCount') or node.get('JobCount') or 0.0
            size_val = node.get('size') or node.get('Size') or 0.0
            
            salary_norm = float(salary_val) / max_salary
            jobs_norm = float(jobs_val) / max_jobs
            size_norm = float(size_val) / max_size
            deg_norm = node_degrees[idx] / max_deg
            
            group = node.get('group') or node.get('Group') or 'Skill'
            is_skill = 1.0 if group == 'Skill' else 0.0
            is_lang = 1.0 if group == 'Language' else 0.0
            
            # Vector đặc trưng 6 chiều
            features.append([salary_norm, jobs_norm, is_skill, is_lang, deg_norm, size_norm])
            
        x = torch.tensor(features, dtype=torch.float)
        
        # Đóng gói thành object Data chuẩn của PyTorch Geometric
        graph_data = Data(x=x, edge_index=edge_index)
        
        return graph_data, sql_to_idx, idx_to_sql, idx_to_name
        
    except Exception as e:
        print(f"❌ Lỗi khi load dữ liệu từ C#: {e}")
        return None, {}, {}, {}