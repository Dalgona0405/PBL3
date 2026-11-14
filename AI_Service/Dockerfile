FROM python:3.11-slim

WORKDIR /app

# Không tạo file .pyc và ép Python in log trực tiếp ra Terminal Docker không bị trễ (buffer)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 1. Cài đặt PyTorch bản CPU siêu nhẹ trước (Tránh tải 2.5GB CUDA không cần thiết)
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Cài đặt PyTorch Geometric và các thư viện Web API cốt lõi
RUN pip install --no-cache-dir \
    torch-geometric \
    fastapi \
    "uvicorn[standard]" \
    pydantic \
    requests \
    numpy \
    scikit-learn \
    pypdf \
    python-multipart

# 3. Copy toàn bộ mã nguồn Python và 2 file trọng số (.pth) vào container
COPY . .

EXPOSE 8000

# Chạy FastAPI server bằng Uvicorn lắng nghe trên mọi IP nội bộ (0.0.0.0)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]