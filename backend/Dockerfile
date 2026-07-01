FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm install --omit=dev --no-audit --no-fund

COPY backend backend

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace", "backend"]
