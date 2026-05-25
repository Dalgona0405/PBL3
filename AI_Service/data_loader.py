import torch
import requests
from torch_geometric.data import Data

def fetch_and_process_data(api_url="http://localhost:5000/api/reports/graph-skills?limit=200"):
    try:
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
        node_degrees = [1.0] * num_nodes # Khởi tạo mỗi nút có bậc ít nhất là 1
        
        for edge in raw_edges:
            src_sql, tgt_sql = edge['from'], edge['to']
            if src_sql in sql_to_idx and tgt_sql in sql_to_idx:
                src_idx = sql_to_idx[src_sql]
                tgt_idx = sql_to_idx[tgt_sql]
                
                src_indices.append(src_idx)
                tgt_indices.append(tgt_idx)
                
                # Tăng bậc (degree) cho nút khi có kết nối
                node_degrees[src_idx] += 1.0
                node_degrees[tgt_idx] += 1.0
                
        edge_index = torch.tensor([src_indices, tgt_indices], dtype=torch.long)
        
        # 3. MA TRẬN ĐẶC TRƯNG X (Feature Matrix)
        # Chuyển list bậc thành tensor cột (Nx1)
        x = torch.tensor(node_degrees, dtype=torch.float).view(-1, 1)
        
        # Đóng gói thành object Data chuẩn của PyTorch Geometric
        graph_data = Data(x=x, edge_index=edge_index)
        
        return graph_data, sql_to_idx, idx_to_sql, idx_to_name
        
    except Exception as e:
        print(f"Lỗi khi load dữ liệu: {e}")
        return None, {}, {}, {} 