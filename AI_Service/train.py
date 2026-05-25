import pickle
import torch
import torch.nn.functional as F
from torch_geometric.utils import negative_sampling
from data_loader import fetch_and_process_data
from model import GCNNet, LinkPredictor

def train_gnn():
    print("Starting GNN training...")

    # 1. Load data từ API
    graph_data, _, _, _ = fetch_and_process_data()

    if graph_data is None or graph_data.num_nodes == 0:
        print("Have no data to train!")
        return

    x = graph_data.x
    pos_edge_index = graph_data.edge_index
    num_nodes = graph_data.num_nodes

    # 2. Model
    encoder = GCNNet(in_channels=1, hidden_channels=32, out_channels=16)
    predictor = LinkPredictor()

    optimizer = torch.optim.Adam(
        list(encoder.parameters()) + list(predictor.parameters()),
        lr=0.01
    )

    encoder.train()
    predictor.train()

    epochs = 100

    for epoch in range(1, epochs + 1):
        optimizer.zero_grad()

        # Encode
        z = encoder(x, pos_edge_index)

        # Negative sampling
        neg_edge_index = negative_sampling(
            edge_index=pos_edge_index,
            num_nodes=num_nodes,
            num_neg_samples=pos_edge_index.size(1)
        )

        # Combine edges
        total_edge_index = torch.cat([pos_edge_index, neg_edge_index], dim=-1)

        # Labels
        pos_label = torch.ones(pos_edge_index.size(1))
        neg_label = torch.zeros(neg_edge_index.size(1))
        true_labels = torch.cat([pos_label, neg_label], dim=0)

        # Predict
        predictions = predictor(z, total_edge_index)

        # Loss
        loss = F.binary_cross_entropy_with_logits(predictions, true_labels)

        # Backprop
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0:
            print(f'Epoch {epoch:03d}, Loss: {loss.item():.4f}')

    torch.save(encoder.state_dict(), 'gnn_encoder.pth')
    print("Saved model!")

if __name__ == "__main__":
    train_gnn()