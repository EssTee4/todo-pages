# Use official Node (alpine) base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the project files
COPY . .

# Build the project (if there's a build step; if not, skip)
# RUN npm run build


# Start the app — adjust if your start script is different
CMD ["npm", "start"]
