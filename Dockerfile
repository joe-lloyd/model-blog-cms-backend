# Backend Dockerfile
FROM --platform=linux/amd64 node:18-alpine

# Set the working directory
WORKDIR /app

# Install dependencies for SQLite support
RUN apk add --no-cache sqlite

# Copy package files
COPY package*.json ./

# Install dependencies, including sqlite3
RUN npm install

# Copy the rest of the application
COPY . .

# Ensure the database directory exists
RUN mkdir -p /app/data

# Build the application
RUN npm run build

# Expose the backend port
EXPOSE 3001

# Run the application
CMD ["npm", "run", "start:prod"]
