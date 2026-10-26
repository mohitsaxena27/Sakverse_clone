# Use official Node.js LTS image
FROM node:20-slim

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose port your API listens on (adjust if needed)
EXPOSE 3000

# Run your app
CMD ["node", "proxy"]
