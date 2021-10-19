# syntax=docker/dockerfile:1
FROM nginx
COPY web/dist /usr/share/nginx/html