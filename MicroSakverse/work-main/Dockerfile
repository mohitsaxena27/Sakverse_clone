# FROM nginx:alpine

# # Remove default Nginx files
# RUN rm -rf /usr/share/nginx/html/*

# # Copy your existing dist folder
# COPY dist /usr/share/nginx/html

# # Copy your Nginx config (SPA routing + backend proxy)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# # Copy certificates
# COPY certs/certificate.crt /etc/ssl/certs/certificate.crt
# COPY certs/private.key /etc/ssl/certs/private.key

# # Expose port
# EXPOSE 5175

# # Start Nginx
# CMD ["nginx", "-g", "daemon off;"]
# ---- Stage 1: Build the frontend with Node ----
FROM node:18-alpine AS build
 
# Set working directory
WORKDIR /work-main
 
# Copy package files and install dependencies
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm cache clean --force
RUN npm install
 
# Copy the rest of your project files
COPY . .
 
# Build the production-ready Vite app
RUN npm run build
 
# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine
 
# Remove default Nginx files
RUN rm -rf /usr/share/nginx/html/*
 
# Copy the built files from the previous stage
COPY --from=build /work-main/dist /usr/share/nginx/html
 
# Copy Nginx config (SPA routing + proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# Copy SSL certificates
COPY certs/certificate.crt /etc/ssl/certs/certificate.crt
COPY certs/private.key /etc/ssl/certs/private.key
 
# Expose port (adjust to your needs)
EXPOSE 5175
 
# Start Nginx
CMD ["nginx", "-g", "daemon off;"]