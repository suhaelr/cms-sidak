# Multi-stage: build Vite SPA, serve static files with nginx.
# .env.production wajib ada sebelum build (dari CI prepare-build-env / Vault, atau salinan lokal).
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN if [ ! -f .env.production ] || ! grep -q '^VITE_SUPABASE_URL=.' .env.production; then \
      echo "ERROR: .env.production tidak ada atau VITE_SUPABASE_URL kosong."; \
      echo "CI: pastikan job prepare-build-env + Vault sudah jalan."; \
      echo "Lokal: cp .env.example .env.production lalu isi nilai Supabase."; \
      exit 1; \
    fi

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
