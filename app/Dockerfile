FROM node:16-alpine

WORKDIR /app

# Copiar package.json e package-lock.json primeiro para aproveitar o cache do Docker
COPY package*.json ./
RUN npm install

# Copiar o resto dos arquivos
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
