import torch
import pickle
import numpy as np
from skill_extractor import SkillExtractor

def build_training_pairs_from_applications(applications_df, job_skill_matrix, idx_to_job_id, skill_id_to_idx):
    """
    applications_df: list of {candidate_id, job_id, status} (1=accepted, 0=rejected)
    Trả về list các tuple (cv_skills_set, pos_job_idx, neg_job_idx)
    """
    # Giả sử mỗi candidate có một set các skill (cần lấy từ CandidateTags)
    # Ở đây tôi tạm tạo giả định: candidate có các skill là những skill xuất hiện trong job họ đã apply và được accept
    pairs = []
    # TODO: implement dựa trên dữ liệu thực
    return pairs