# --- build ---------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Las dependencias se copian antes que el código para que Docker reutilice la capa de
# `npm ci` mientras el package-lock no cambie.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# --- runtime -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# La imagen de Node ya trae el usuario `node`: no hay motivo para servir como root.
USER node

EXPOSE 3001

CMD ["node", "dist/main.js"]
