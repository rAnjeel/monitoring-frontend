# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

# Installer les dépendances
COPY package*.json ./
RUN npm i

COPY . ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build initial du frontend
RUN npm run build

# --- Production / Dev stage ---
FROM node:20-alpine
WORKDIR /app

# Installer runtime + PM2 + concurrently
COPY package*.json ./
RUN npm install --omit=dev express@^4.18.2 ejs pm2 concurrently

# Copier le build frontend et serveur
COPY --from=build /app/dist ./dist
COPY server.js ./server.js
COPY views ./views

RUN npm i

# Exposer le port pour Express
EXPOSE 8080

# --- Commande pour dev/prod ---
# Dev : rebuild automatique du frontend
# Prod : sert simplement le dist via PM2
CMD ["npm", "run", "dev"]

