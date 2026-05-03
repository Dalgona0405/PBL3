import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import GCNConv

# Encoder (GCN)
class GCNNet(nn.Module):
    def __init__(self, in_channels, hidden_channels=32, out_channels=16):
        super(GCNNet, self).__init__()
        self.conv1 = GCNConv(in_channels, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, out_channels)
        self.dropout = nn.Dropout(0.5)

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

# Hàm tính score riêng (dùng khi inference)
def calculate_score(z, source_idx, target_idx):
    src_vec = z[source_idx]
    tgt_vec = z[target_idx]
    return torch.sigmoid((src_vec * tgt_vec).sum()).item()