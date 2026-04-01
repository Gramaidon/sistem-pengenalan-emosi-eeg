FROM python:3.10-slim

WORKDIR /app

# 1. Menginstal alat compiler bawaan Linux (gcc, g++, build-essential)
# Ini sangat krusial untuk library Machine Learning dan komputasi sains
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# 2. Meng-upgrade pip ke versi terbaru sebelum menginstal library
RUN pip install --upgrade pip

# 3. Menginstal library dari requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Menjalankan script klasifikasi hibrida
CMD ["python", "preprocessing_classification.py"]