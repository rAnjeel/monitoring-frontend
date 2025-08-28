# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Ensure env variables are available at build time for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build du frontend avec Vite
RUN npm run build

# --- Production stage ---
FROM node:20-alpine
WORKDIR /app

# Copier uniquement les fichiers nécessaires
COPY package*.json ./
RUN npm install --omit=dev express@^4.18.2 ejs

COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY views ./views

EXPOSE 8080

CMD ["node", "server.js"]
