FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

# Set executable permissions
RUN chmod +x ./dist/index.js

# Run the MCP server
ENTRYPOINT ["node", "dist/index.js"]
