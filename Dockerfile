# Base Node.js Image
FROM node:22.11.0-slim AS base

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./ 
RUN npm install --frozen-lockfile

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . . 
RUN npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install yt-dlp in the runner stage (important!)
RUN apt-get update && apt-get install -y curl ffmpeg \
    && curl -L https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Copy necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Verify yt-dlp installation
RUN yt-dlp --version

EXPOSE 3003
CMD ["npm", "run", "start"]
