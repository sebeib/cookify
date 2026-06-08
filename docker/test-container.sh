#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

IMAGE_NAME="${IMAGE_NAME:-cookify-app:local}"
APP_CONTAINER="${APP_CONTAINER:-cookify-app}"
DB_CONTAINER="${DB_CONTAINER:-cookify-postgres}"
NETWORK_NAME="${NETWORK_NAME:-cookify-local}"
DB_NAME="${DB_NAME:-cookify}"
DB_USER="${DB_USER:-cookify}"
DB_PASSWORD="${DB_PASSWORD:-cookify}"

cleanup() {
  docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
  docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
  docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

docker rm -f "$APP_CONTAINER" >/dev/null 2>&1 || true
docker rm -f "$DB_CONTAINER" >/dev/null 2>&1 || true
docker network rm "$NETWORK_NAME" >/dev/null 2>&1 || true
docker network create "$NETWORK_NAME" >/dev/null

echo "Starting PostgreSQL test container..."
docker run -d \
  --name "$DB_CONTAINER" \
  --network "$NETWORK_NAME" \
  -e POSTGRES_DB="$DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  postgres:16-alpine >/dev/null

echo "Waiting for PostgreSQL to become ready..."
for _ in {1..30}; do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
  echo "PostgreSQL did not become ready in time." >&2
  exit 1
fi

echo "Building cookify image..."
docker build -f "$ROOT_DIR/docker/Dockerfile" -t "$IMAGE_NAME" "$ROOT_DIR"

echo "Starting cookify on http://localhost:8080 ..."
docker run \
  --name "$APP_CONTAINER" \
  --network "$NETWORK_NAME" \
  -p 8080:8080 \
  -e DB_URL="jdbc:postgresql://$DB_CONTAINER:5432/$DB_NAME" \
  -e DB_USERNAME="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  "$IMAGE_NAME"
