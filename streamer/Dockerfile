FROM python:3.10-slim

WORKDIR /app

# Wajib ada agar instalasi library sains lancar
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip

# Menginstal library
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "streaming_dreamer.py"] 