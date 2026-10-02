#!/usr/bin/env bash
# ============================================
#  Деплой сайта на VDS
#
#  Пайплайн: npm run build -> rsync dist -> docker build -> перезапуск контейнера.
#  Бэкенд не трогаем: он живёт отдельно (контейнер `backend` в сети `mistraly`),
#  а nginx внутри образа ходит в него по DNS-имени `backend`.
#
#  Использование:  ./scripts/deploy.sh [хост]
#  Хост по умолчанию — `mistraly` (алиас в ~/.ssh/config).
# ============================================
set -euo pipefail

HOST="${1:-mistraly}"
REMOTE_DIR="/opt/mistraly/deploy"
CONTAINER="mistraly-site"

cd "$(dirname "$0")/.."

echo "=== Сборка (vite) ==="
npm run build

echo "=== Копирование dist на $HOST:$REMOTE_DIR ==="
# --delete важен: иначе старые хешированные бандлы копятся в образе.
rsync -az --delete dist/ "$HOST:$REMOTE_DIR/dist/"

# Dockerfile и nginx.conf держим в репозитории (deploy/) — на сервер их тоже
# синхронизируем, чтобы источник правды был один.
rsync -az deploy/Dockerfile deploy/nginx.conf "$HOST:$REMOTE_DIR/"

echo "=== Сборка образа ==="
ssh "$HOST" "cd $REMOTE_DIR && docker build -q -t $CONTAINER:latest ."

echo "=== Перезапуск контейнера ==="
# Порт наружу не публикуем: 9090 слушает только localhost, дальше его отдаёт Caddy.
ssh "$HOST" "docker rm -f $CONTAINER >/dev/null 2>&1 || true
docker run -d --name $CONTAINER --restart unless-stopped \
  --network mistraly -p 127.0.0.1:9090:80 $CONTAINER:latest >/dev/null
sleep 2
docker ps --filter name=$CONTAINER --format '{{.Names}}  {{.Status}}  {{.Ports}}'"

echo "=== Проверка ==="
ssh "$HOST" "curl -sf -o /dev/null -w 'mistraly.net: %{http_code}\n' https://mistraly.net/"

echo ""
echo "Готово: https://mistraly.net"