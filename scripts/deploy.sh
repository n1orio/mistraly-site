#!/usr/bin/env bash
# ============================================
#  Деплой сайта на VDS
#
#  Пайплайн: npm run build -> rsync dist -> docker compose build -> up -d
#
#  Бэкенд не трогаем: он живёт отдельным контейнером `backend` в сети
#  `mistraly`, и nginx внутри образа ходит в него по DNS-имени `backend`.
#  На сервере compose тоже управляет только сайтом — см. пояснения
#  в /opt/mistraly/docker-compose.yml.
#
#  Использование:  ./scripts/deploy.sh [хост]
#  Хост по умолчанию — `mistraly` (алиас в ~/.ssh/config).
# ============================================
set -euo pipefail

HOST="${1:-mistraly}"
REMOTE_DIR="/opt/mistraly/deploy"
COMPOSE_DIR="/opt/mistraly"

cd "$(dirname "$0")/.."

echo "=== Сборка (vite) ==="
npm run build

echo "=== Копирование на $HOST:$REMOTE_DIR ==="
# --delete важен: иначе старые хешированные бандлы копятся в образе.
rsync -az --delete dist/ "$HOST:$REMOTE_DIR/dist/"

# Dockerfile и nginx.conf держим в репозитории (deploy/) и синхронизируем
# на сервер, чтобы источник правды был один.
rsync -az deploy/Dockerfile deploy/nginx.conf "$HOST:$REMOTE_DIR/"

echo "=== Сборка образа и перезапуск ==="
# Порт наружу не публикуем: 9090 слушает только localhost, дальше его отдаёт Caddy.
ssh "$HOST" "cd $COMPOSE_DIR && docker compose build site && docker compose up -d site && docker compose ps site"

echo "=== Проверка ==="
ssh "$HOST" "curl -sf -o /dev/null -w 'mistraly.net: %{http_code}\n' https://mistraly.net/"

echo ""
echo "Готово: https://mistraly.net"