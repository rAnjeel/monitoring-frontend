# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Ensure env variables are available at build time for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# --- Express stage ---
FROM node:20-alpine
WORKDIR /app

# Install prod deps (express, ejs, etc.)
COPY package*.json ./
RUN npm install --omit=dev express ejs

# Copy build output and server code
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY views ./views

EXPOSE 3000
CMD ["node", "server.js"]
