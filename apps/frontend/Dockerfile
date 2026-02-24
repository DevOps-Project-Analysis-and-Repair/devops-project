# Stage 1: Build
FROM node:24-alpine AS build
WORKDIR /apps/frontend

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /apps/frontend/dist /usr/share/nginx/html

# Check that the server is responding
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

