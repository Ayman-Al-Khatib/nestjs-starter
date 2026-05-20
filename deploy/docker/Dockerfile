########## Stage 1: Builder (compile TypeScript → dist) ##########
FROM node:22-alpine AS builder

# Install basic system libraries (needed by some native Node modules)
RUN apk add --no-cache libc6-compat python3 make g++

# Development environment for building
ENV NODE_ENV=development

# Set working directory
WORKDIR /usr/src/app

# Copy npm manifests first for better layer caching
COPY package*.json ./

# Install all dependencies including devDependencies (for build tools)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build NestJS (TypeScript → dist)
RUN npm run build


########## Stage 2: Runner (production) ##########
FROM node:22-alpine AS runner

# Production environment
ENV NODE_ENV=production

# Install basic system libraries (same as builder if needed by runtime deps)
RUN apk add --no-cache libc6-compat python3 make g++

# Set working directory
WORKDIR /usr/src/app

# Copy only npm manifests
COPY package*.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev

# Copy compiled build artifacts from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Create temp directories for backups and other runtime needs
RUN mkdir -p /usr/src/app/temp/backups /usr/src/app/logs

# Create non-root user for better security
RUN addgroup -S app && adduser -S app -G app

# Ensure proper ownership of the app directory
RUN chown -R app:app /usr/src/app

# # Switch to non-root user
USER app

# Default application port (can be overridden by the platform)
ENV PORT=3000

# Expose the application port
EXPOSE 3000

# Start the NestJS application
CMD ["node", "dist/main.js"]
