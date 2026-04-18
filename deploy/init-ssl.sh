#!/bin/bash
# ============================================================
# Скрипт первоначального получения SSL-сертификата
# Запускать ОДИН РАЗ перед первым стартом docker compose
# ============================================================
# Использование:
#   chmod +x deploy/init-ssl.sh
#   ./deploy/init-ssl.sh wedding.yourdomain.com your@email.com
# ============================================================

set -e

DOMAIN="${1:?Укажите домен: ./init-ssl.sh wedding.example.com your@email.com}"
EMAIL="${2:?Укажите email: ./init-ssl.sh wedding.example.com your@email.com}"

echo ""
echo "=== Получение SSL-сертификата для $DOMAIN ==="
echo ""

# Убедиться что нет запущенных контейнеров на порту 80
docker compose down --remove-orphans 2>/dev/null || true

# Запустить только nginx в HTTP-режиме (для ACME-challenge)
# Используем временный nginx только для подтверждения домена
echo "→ Запуск временного HTTP-сервера для подтверждения домена..."
docker run -d --rm --name nginx-init \
  -p 80:80 \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  nginx:1.27-alpine sh -c "
    mkdir -p /var/www/certbot
    echo 'server{listen 80;location /.well-known/acme-challenge/{root /var/www/certbot;}}' \
      > /etc/nginx/conf.d/default.conf
    nginx -g 'daemon off;'
  "

echo "→ Получение сертификата от Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/certbot_certs:/etc/letsencrypt" \
  -v "$(pwd)/certbot_www:/var/www/certbot" \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN"

echo "→ Остановка временного сервера..."
docker stop nginx-init 2>/dev/null || true

echo ""
echo "✅ Сертификат получен!"
echo ""
echo "Теперь отредактируйте deploy/nginx-docker.conf — замените YOUR_DOMAIN на: $DOMAIN"
echo "Затем запустите: docker compose up -d"
echo ""
