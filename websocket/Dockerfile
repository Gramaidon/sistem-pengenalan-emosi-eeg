# Menggunakan base image Node.js yang ringan
FROM node:18-alpine

WORKDIR /app

# Menyalin daftar package (package.json)
COPY package*.json ./

# Menginstal dependencies (seperti socket.io, express)
RUN npm install

# Menyalin seluruh kode server
COPY . .

# Mengekspos port WebSocket (misal: 8080)
EXPOSE 8081

# Menjalankan server
CMD ["node", "server.js"]