# ── Development stage ────────────────────────────────────────────────────────
FROM node:24.14-alpine AS dev

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:24.14-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

RUN npm run build

# ── Production stage (serve built assets) ────────────────────────────────────
FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback: all routes → index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
