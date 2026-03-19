FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

EXPOSE 3001

CMD ["npm", "start"]
