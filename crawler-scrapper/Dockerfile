# Multi-stage Dockerfile optimisé pour la production
FROM node:20-alpine AS base

# Installer curl pour les health checks
RUN apk add --no-cache curl

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /usr/src/app

# Copier les fichiers de dépendances
COPY package*.json ./

# Stage de développement
FROM base AS development
ENV NODE_ENV=development

# Installer toutes les dépendances (dev + production)
RUN npm ci --include=dev

# Copier le code source
COPY . .

# Builder l'application TypeScript
RUN npm run build

# Exposer le port
EXPOSE 3000

# Commande par défaut pour le développement
CMD ["npm", "run", "start:dev"]

# Stage de build pour la production
FROM base AS builder
ENV NODE_ENV=production

# Installer toutes les dépendances pour le build
RUN npm ci --include=dev

# Copier le code source
COPY . .

# Builder l'application
RUN npm run build

# Nettoyer les dépendances de dev après le build
RUN npm ci --only=production && npm cache clean --force

# Stage de production final
FROM base AS production
ENV NODE_ENV=production

# Changer vers l'utilisateur non-root
USER nodejs

# Copier seulement les dépendances de production depuis le builder
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/node_modules ./node_modules

# Copier le code buildé
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/dist ./dist

# Copier les fichiers de configuration nécessaires
COPY --from=builder --chown=nodejs:nodejs /usr/src/app/package*.json ./

# Créer le dossier logs
RUN mkdir -p /usr/src/app/logs

# Exposer le port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Commande par défaut
CMD ["npm", "run", "start:prod"]