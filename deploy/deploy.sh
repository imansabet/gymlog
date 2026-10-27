#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
docker compose -f docker-compose.prod.yml ps
