import os
import torch
import requests
from torch_geometric.data import Data

# Lấy URL Backend C# từ biến môi trường, mặc định localhost:5000 khi chạy local
CSHARP_API_URL = os.getenv("CSHARP_API_URL", "http://localhost:5000")


def fetch_and_process_data(limit: int = 200):
    """
    Kéo dữ liệu đồ thị kỹ năng từ Backend C# và chuyển đổi thành đối tượng Data của PyTorch Geometric.
    Trả về tuple (graph_data, sql_to_idx, idx_to_sql, idx_to_name), hoặc (None, {}, {}, {}) nếu lỗi.
    """
    api_url = f"{CSHARP_API_URL}/api/reports/graph-skills?limit={limit}"

    try:
        print(f"Fetching skill graph data from C# API: {api_url}")
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        raw_data = response.json()

        raw_nodes = raw_data.get("nodes", [])
        raw_edges = raw_data.get("edges", [])

        # Bộ ánh xạ hai chiều giữa TagId trong SQL Server và chỉ số nút (index) trên đồ thị GNN
        sql_to_idx = {}
        idx_to_sql = {}
        idx_to_name = {}

        for idx, node in enumerate(raw_nodes):
            sql_id = node.get("id") or node.get("Id")
            sql_to_idx[sql_id] = idx
            idx_to_sql[idx] = sql_id
            idx_to_name[idx] = node.get("label", f"Skill_{sql_id}")

        num_nodes = len(raw_nodes)

        # Tạo danh sách cạnh vô hướng (2 chiều) và đếm bậc của từng nút kỹ năng
        src_indices = []
        tgt_indices = []
        node_degrees = [1.0] * num_nodes

        for edge in raw_edges:
            src_sql, tgt_sql = edge["from"], edge["to"]
            if src_sql in sql_to_idx and tgt_sql in sql_to_idx:
                src_idx = sql_to_idx[src_sql]
                tgt_idx = sql_to_idx[tgt_sql]

                # Thêm cả hai chiều để tầng GATConv truyền thông tin hai chiều giữa các kỹ năng đi kèm
                src_indices.extend([src_idx, tgt_idx])
                tgt_indices.extend([tgt_idx, src_idx])

                node_degrees[src_idx] += 1.0
                node_degrees[tgt_idx] += 1.0

        edge_index = torch.tensor([src_indices, tgt_indices], dtype=torch.long)

        # Ma trận đặc trưng X gồm 8 chiều được chuẩn hóa về đoạn [0, 1]
        features = []
        max_salary = max([n.get("currentAvgSalary") or n.get("CurrentAvgSalary") or 0.0 for n in raw_nodes], default=0.0) or 1.0
        max_jobs = max([n.get("jobCount") or n.get("JobCount") or 0.0 for n in raw_nodes], default=0.0) or 1.0
        max_size = max([n.get("size") or n.get("Size") or 0.0 for n in raw_nodes], default=0.0) or 1.0
        max_deg = max(node_degrees, default=1.0) or 1.0

        for idx in range(num_nodes):
            node = raw_nodes[idx]
            salary_val = node.get("currentAvgSalary") or node.get("CurrentAvgSalary") or 0.0
            jobs_val = node.get("jobCount") or node.get("JobCount") or 0.0
            size_val = node.get("size") or node.get("Size") or 0.0

            salary_norm = float(salary_val) / max_salary
            jobs_norm = float(jobs_val) / max_jobs
            size_norm = float(size_val) / max_size
            deg_norm = node_degrees[idx] / max_deg

            group = node.get("group") or node.get("Group") or "Skill"
            is_skill = 1.0 if group == "Skill" else 0.0
            is_lang = 1.0 if group == "Language" else 0.0
            is_role = 1.0 if group == "Role" else 0.0
            is_domain = 1.0 if group == "Domain" else 0.0

            # Vector đặc trưng 8 chiều cho mỗi nút kỹ năng
            features.append([salary_norm, jobs_norm, is_skill, is_lang, is_role, is_domain, deg_norm, size_norm])

        x = torch.tensor(features, dtype=torch.float)
        graph_data = Data(x=x, edge_index=edge_index)

        return graph_data, sql_to_idx, idx_to_sql, idx_to_name

    except Exception as e:
        print(f"Failed to load graph data from C# API: {e}")
        return None, {}, {}, {}