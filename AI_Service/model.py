import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GATConv

# Encoder (GAT - Graph Attention Network)
class GCNNet(nn.Module):
    def __init__(self, in_channels=6, hidden_channels=32, out_channels=16):
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

# Decoder (Link Prediction)
class LinkPredictor(nn.Module):
    def forward(self, z, edge_index):
        src = z[edge_index[0]]
        dst = z[edge_index[1]]
        return (src * dst).sum(dim=-1)

# Decoder 2 (Salary Potential Regressor MLP)
class SalaryRegressor(nn.Module):
    def __init__(self, in_channels=16, hidden_channels=8):
        super(SalaryRegressor, self).__init__()
        self.fc1 = nn.Linear(in_channels, hidden_channels)
        self.fc2 = nn.Linear(hidden_channels, 1)

    def forward(self, z):
        x = self.fc1(z)
        x = F.relu(x)
        x = self.fc2(x)
        return x

# Hàm tính score riêng (dùng khi inference)
def calculate_score(z, source_idx, target_idx):
    src_vec = z[source_idx]
    tgt_vec = z[target_idx]
    return torch.sigmoid((src_vec * tgt_vec).sum()).item()