import torch
import torch.nn.functional as F
from torch_geometric.utils import negative_sampling
from sklearn.metrics import roc_auc_score, mean_absolute_error # 👈 THÊM DÒNG NÀY
import numpy as np

from data_loader import fetch_and_process_data
from model import GCNNet, LinkPredictor, SalaryRegressor

def train_gnn():
    print("Starting GNN training...")

    graph_data, _, _, _ = fetch_and_process_data()
    if graph_data is None or graph_data.num_nodes == 0:
        print("Have no data to train!")
        return

    x = graph_data.x
    pos_edge_index = graph_data.edge_index
    num_nodes = graph_data.num_nodes

    encoder = GCNNet(in_channels=6, hidden_channels=32, out_channels=16)
    predictor = LinkPredictor()
    regressor = SalaryRegressor(in_channels=16, hidden_channels=8)

    optimizer = torch.optim.Adam(
        list(encoder.parameters()) + list(predictor.parameters()) + list(regressor.parameters()),
        lr=0.01
    )

    salaries_true = x[:, 0]
    salary_mask = salaries_true > 0.0

    epochs = 100

    for epoch in range(1, epochs + 1):
        encoder.train()
        predictor.train()
        regressor.train()
        
        optimizer.zero_grad()
        z = encoder(x, pos_edge_index)

        neg_edge_index = negative_sampling(
            edge_index=pos_edge_index, num_nodes=num_nodes, num_neg_samples=pos_edge_index.size(1)
        )
        total_edge_index = torch.cat([pos_edge_index, neg_edge_index], dim=-1)

        pos_label = torch.ones(pos_edge_index.size(1))
        neg_label = torch.zeros(neg_edge_index.size(1))
        true_labels = torch.cat([pos_label, neg_label], dim=0)

        predictions = predictor(z, total_edge_index)
        loss_link = F.binary_cross_entropy_with_logits(predictions, true_labels)

        loss_reg = torch.tensor(0.0)
        if salary_mask.sum() > 0:
            pred_salaries = regressor(z[salary_mask]).squeeze()
            loss_reg = F.mse_loss(pred_salaries, salaries_true[salary_mask])

        loss = loss_link + 2.0 * loss_reg
        loss.backward()
        optimizer.step()

        if epoch % 10 == 0:
            print(f'Epoch {epoch:03d}, Total Loss: {loss.item():.4f}')

    encoder.eval()
    predictor.eval()
    regressor.eval()
    with torch.no_grad():
        z = encoder(x, pos_edge_index)
        
        # 1. Kiểm chứng Gợi ý kỹ năng (Link Prediction) bằng AUC Score
        final_preds = predictor(z, total_edge_index).sigmoid().numpy()
        final_labels = true_labels.numpy()
        auc_score = roc_auc_score(final_labels, final_preds)
        
        # 2. Kiểm chứng Dự báo lương (Salary Regression) bằng MAE
        if salary_mask.sum() > 0:
            final_pred_salaries = regressor(z[salary_mask]).squeeze().numpy()
            final_true_salaries = salaries_true[salary_mask].numpy()
            mae_score = mean_absolute_error(final_true_salaries, final_pred_salaries)
        else:
            mae_score = 0.0

    print("\n" + "="*40)
    print("📊 KẾT QUẢ KIỂM CHỨNG MÔ HÌNH (VALIDATION METRICS)")
    print(f"✅ Độ chính xác gợi ý kỹ năng (AUC Score): {auc_score * 100:.2f}%")
    print(f"✅ Sai số dự báo lương (MAE): {mae_score:.4f} (Đã chuẩn hóa)")
    print("="*40 + "\n")

    torch.save(encoder.state_dict(), 'gnn_encoder.pth')
    torch.save(regressor.state_dict(), 'gnn_regressor.pth')
    print("Saved model!")

if __name__ == "__main__":
    train_gnn()