# Multi-stage build for production efficiency
FROM node:18-alpine AS build
WORKDIR /app
# Build tools needed for native addons (e.g. bcrypt)
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN HUSKY=0 npm ci
COPY . .
RUN npm run build && HUSKY=0 npm prune --production

FROM node:18-alpine AS production
WORKDIR /app

# Add root CAs so TLS works (RDS, etc.)
RUN apk --no-cache add ca-certificates curl && update-ca-certificates \
  && curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /tmp/rds-global.pem \
  && curl -fsSL https://truststore.pki.rds.amazonaws.com/us-west-2/us-west-2-bundle.pem -o /tmp/rds-us-west-2.pem \
  && cat /tmp/rds-global.pem /tmp/rds-us-west-2.pem > /usr/local/share/ca-certificates/aws-rds-combined.crt \
  && rm -f /tmp/rds-global.pem /tmp/rds-us-west-2.pem \
  && update-ca-certificates

# Ensure Node picks up the additional CA bundle
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/aws-rds-combined.crt

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built application and pruned production node_modules from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main"] 