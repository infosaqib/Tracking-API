ARG PLATFORM=linux/arm64
FROM --platform=$BUILDPLATFORM node:lts-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package files first
COPY package*.json yarn.lock tsconfig.json ./
COPY prisma ./prisma/

# Install ALL dependencies (dev included, so @nestjs/cli is available)
RUN yarn install

# Copy source
COPY . .

# Build
RUN yarn prisma:generate && yarn nest build background-jobs

# ---- Production image ----
FROM node:lts-alpine

WORKDIR /usr/src/app
RUN apk add --no-cache openssl

# Only install prod deps
COPY package*.json yarn.lock ./
RUN yarn install --production

# Copy dist + prisma + node_modules/.prisma
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

USER node
ENV NODE_OPTIONS="--max-old-space-size=4096"

CMD ["yarn", "docker-start:background-jobs"]
