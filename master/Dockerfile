# ---------- Stage 1: Build Frontend ----------
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY ./frontend/package*.json .
RUN npm install

# Copy frontend source and build
COPY ./frontend .
RUN npm run build


# ---------- Stage 2: Backend ----------
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY ./master/package*.json ./

# Install dependencies
RUN npm install

# Copy backend application code
COPY ./master .

# Copy frontend build output into backend
COPY --from=frontend-builder /frontend/dist ./frontend-build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
