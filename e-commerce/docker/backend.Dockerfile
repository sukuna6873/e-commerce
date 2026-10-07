# Backend Dockerfile - Alpine based
FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY backend/package*.json ./
RUN npm ci

# Copy source code
COPY backend/ .

EXPOSE 3001

CMD ["npm", "run", "dev"]