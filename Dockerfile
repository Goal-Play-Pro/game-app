FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Force bcrypt to build from source for Alpine Linux compatibility
ENV npm_config_build_from_source=true

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod"]