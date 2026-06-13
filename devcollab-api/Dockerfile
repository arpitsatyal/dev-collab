# Base image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files for installing production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# The API runs on 4000 by default in the .env, expose it
EXPOSE 4000

# Set default port to 4000
ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "dist/main"]
