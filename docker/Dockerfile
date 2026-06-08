FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


FROM maven:3.9.9-eclipse-temurin-21 AS backend-build

WORKDIR /app/backend

COPY backend/pom.xml ./
COPY backend/src ./src

RUN mvn -q -DskipTests package


FROM eclipse-temurin:21-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY --from=backend-build /app/backend/target/quarkus-app /opt/cookify/backend
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /usr/local/bin/cookify-entrypoint.sh

RUN chmod +x /usr/local/bin/cookify-entrypoint.sh \
    && mkdir -p /run/nginx

EXPOSE 8080

ENV HTTP_PORT=8081

ENTRYPOINT ["/usr/local/bin/cookify-entrypoint.sh"]
