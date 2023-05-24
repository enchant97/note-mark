# syntax=docker/dockerfile:1.4

FROM node:18-alpine3.16 as builder

    WORKDIR /app

    COPY package.json .

    RUN npm install

    COPY . .

    RUN npm run build

FROM nginxinc/nginx-unprivileged:1.24-alpine

    COPY --from=builder --link /app/dist /usr/share/nginx/html
    COPY --link nginx.conf /etc/nginx/conf.d/default.conf

    EXPOSE 8080
