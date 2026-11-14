import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv

class GCNNet(nn.Module):
    """Bộ mã hóa đồ thị dùng 2 tầng Graph Attention Network (GATConv) để tạo vector biểu diễn 16 chiều cho mỗi kỹ năng."""

    def __init__(self, in_channels=8, hidden_channels=32, out_channels=16):
        super(GCNNet, self).__init__()
        self.conv1 = GATConv(in_channels, hidden_channels, heads=2, concat=True)
        self.conv2 = GATConv(hidden_channels * 2, out_channels, heads=1, concat=False)
        self.dropout = nn.Dropout(0.3)

    def forward(self, x, edge_index):
        x = self.conv1(x, edge_index)
        x = F.relu(x)
        x = self.dropout(x)
        x = self.conv2(x, edge_index)
        return x


class LinkPredictor(nn.Module):
    """Bộ giải mã dự đoán liên kết giữa hai kỹ năng dựa trên Cosine Similarity đã nhân hệ số nhiệt độ."""

    def __init__(self, temperature=5.0):
        super(LinkPredictor, self).__init__()
        self.temperature = temperature

    def forward(self, z, edge_index):
        # Chuẩn hóa L2 trước khi nhân tích vô hướng để tối ưu đúng góc Cosine giống hàm calculate_score lúc suy luận
        z_norm = F.normalize(z, p=2, dim=-1)
        src = z_norm[edge_index[0]]
        dst = z_norm[edge_index[1]]
        return (src * dst).sum(dim=-1) * self.temperature


class SalaryRegressor(nn.Module):
    """Mạng MLP 2 lớp dự đoán chỉ số tiềm năng lương từ vector biểu diễn kỹ năng."""

    def __init__(self, in_channels=16, hidden_channels=8):
        super(SalaryRegressor, self).__init__()
        self.fc1 = nn.Linear(in_channels, hidden_channels)
        self.fc2 = nn.Linear(hidden_channels, 1)

    def forward(self, z):
        x = self.fc1(z)
        x = F.relu(x)
        x = self.fc2(x)
        return x


def calculate_score(z, source_idx, target_idx):
    """Tính độ tương đồng Cosine Similarity (trong khoảng [-1, 1]) giữa hai nút kỹ năng khi suy luận."""
    src_vec = z[source_idx]
    tgt_vec = z[target_idx]
    return F.cosine_similarity(src_vec.unsqueeze(0), tgt_vec.unsqueeze(0)).item()