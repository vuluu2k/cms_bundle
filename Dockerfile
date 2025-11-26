FROM node:24-slim

# Install build dependencies for isolated-vm
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create bundle directory if it doesn't exist
RUN mkdir -p bundle

# Expose port
EXPOSE 3008

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3008

# Start the application
CMD ["npm", "start"]

