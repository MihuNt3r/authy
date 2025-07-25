# Use official Node.js LTS image as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Build the application
RUN npm run build

# Expose the port Nest.js listens on
EXPOSE 3000

# Run migrations before starting the app
CMD npm run db:migrate && node dist/src/main.js