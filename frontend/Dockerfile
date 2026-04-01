FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Mengekspos port default Vite/Create React App (misal: 3000 atau 5173)
EXPOSE 3000

# Menjalankan environment development React
CMD ["npm", "run", "dev"]