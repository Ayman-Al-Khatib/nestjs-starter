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

# sharp's prebuilt musl binary needs libc6-compat at runtime. The build
# toolchain (python3/make/g++) is intentionally NOT installed in the runtime
# image — it belongs only in the builder stage. Leaving it out shrinks the
# image and trims the attack surface.
RUN apk add --no-cache libc6-compat

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

# The app honors a platform-injected PORT (see resolvePort in main.ts) and
# falls back to APP_PORT. Default to 3000 for a plain `docker run`.
ENV PORT=3000
EXPOSE 3000

# Liveness probe against the unversioned /healthz route. Uses node rather than
# curl (absent in the slim alpine image) and resolves the port the same way
# the app does.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "const p=process.env.PORT||process.env.APP_PORT||3000;require('http').get('http://127.0.0.1:'+p+'/healthz',r=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

# Start the NestJS application
CMD ["node", "dist/main.js"]
