# Развёртывание: Свадебные приглашения

Полная инструкция по запуску на VPS/сервере.

---

## Требования к серверу

| Компонент  | Минимум       |
|------------|---------------|
| OS         | Ubuntu 22.04+ / Debian 12+ |
| CPU        | 1 ядро        |
| RAM        | 1 GB          |
| Диск       | 10 GB         |
| Docker     | 24+           |
| Домен      | Должен указывать на IP сервера |

---

## Вариант 1 — Docker (рекомендуется)

Самый простой способ. Нужен только Docker.

### Шаг 1 — Установить Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Шаг 2 — Скачать проект

```bash
git clone https://github.com/hakimo27/wedding_invitations.git
cd wedding_invitations
```

### Шаг 3 — Настроить переменные окружения

```bash
cp .env.example .env
nano .env
```

Заполните обязательные поля:

```env
APP_BASE_URL=https://wedding.ваш-домен.ru
DOMAIN=wedding.ваш-домен.ru
ADMIN_PASSWORD=придумайте_надёжный_пароль
DB_PASSWORD=пароль_базы_данных
SSL_EMAIL=ваш@email.ru
```

### Шаг 4 — Получить SSL-сертификат (один раз)

Перед первым запуском нужно получить сертификат Let's Encrypt.

```bash
# Сделать скрипт исполняемым
chmod +x deploy/init-ssl.sh

# Запустить (замените на свой домен и email)
./deploy/init-ssl.sh wedding.ваш-домен.ru ваш@email.ru
```

Скрипт автоматически:
- запустит временный HTTP-сервер
- получит SSL-сертификат от Let's Encrypt
- сохранит сертификат

### Шаг 5 — Указать домен в nginx-конфиге

```bash
# Замените YOUR_DOMAIN на ваш реальный домен в двух местах
sed -i 's/YOUR_DOMAIN/wedding.ваш-домен.ru/g' deploy/nginx-docker.conf
```

Или откройте `deploy/nginx-docker.conf` вручную и замените все `YOUR_DOMAIN`.

### Шаг 6 — Запустить всё

```bash
docker compose up -d --build
```

Это запустит три контейнера:
- **db** — PostgreSQL база данных
- **app** — Node.js сервер приглашений
- **nginx** — веб-сервер с SSL

### Шаг 7 — Инициализировать базу данных

```bash
docker compose exec app sh -c "DATABASE_URL=\$DATABASE_URL pnpm db:push"
```

### Готово!

Откройте `https://wedding.ваш-домен.ru/admin` в браузере и войдите с вашим паролем.

---

## Полезные команды Docker

```bash
# Статус контейнеров
docker compose ps

# Логи приложения
docker compose logs -f app

# Логи nginx
docker compose logs -f nginx

# Перезапустить приложение (например, после обновления)
docker compose restart app

# Остановить всё
docker compose down

# Остановить и удалить данные БД (осторожно!)
docker compose down -v
```

---

## Обновление проекта

```bash
cd wedding_invitations

# Загрузить новую версию
git pull

# Пересобрать и перезапустить
docker compose up -d --build

# Применить изменения в схеме БД (если были)
docker compose exec app sh -c "DATABASE_URL=\$DATABASE_URL pnpm db:push"
```

---

## Продление SSL-сертификата

Сертификаты Let's Encrypt действуют 90 дней. Продление:

```bash
docker compose --profile certbot run --rm certbot

# Перезагрузить nginx для применения нового сертификата
docker compose exec nginx nginx -s reload
```

Добавьте в cron для автоматического продления (раз в 2 месяца):

```bash
crontab -e
# Добавьте строку:
0 3 1 */2 * cd /путь/к/wedding_invitations && docker compose --profile certbot run --rm certbot && docker compose exec nginx nginx -s reload
```

---

## Резервное копирование базы данных

```bash
# Создать бэкап
docker compose exec db pg_dump -U wedding_user wedding_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из бэкапа
cat backup_20260101_120000.sql | docker compose exec -T db psql -U wedding_user wedding_db
```

Автоматический ежедневный бэкап через cron:

```bash
crontab -e
# Каждый день в 4:00, хранить 30 дней:
0 4 * * * cd /путь/к/wedding_invitations && docker compose exec -T db pg_dump -U wedding_user wedding_db | gzip > /backups/wedding_$(date +\%Y\%m\%d).sql.gz && find /backups -name 'wedding_*.sql.gz' -mtime +30 -delete
```

---

## Вариант 2 — VPS без Docker (PM2 + nginx)

Если Docker недоступен или нежелателен.

### Установить Node.js и зависимости

```bash
# Node.js 22 через nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Менеджеры пакетов и процессов
npm i -g pnpm pm2
```

### Установить и настроить PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl enable --now postgresql

sudo -u postgres psql -c "CREATE USER wedding_user WITH PASSWORD 'надёжный_пароль';"
sudo -u postgres psql -c "CREATE DATABASE wedding_db OWNER wedding_user;"
```

### Установить Nginx

```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Скопировать конфиг
sudo cp deploy/nginx.conf /etc/nginx/sites-available/wedding
# Заменить YOUR_DOMAIN на реальный домен
sudo sed -i 's/YOUR_DOMAIN/wedding.ваш-домен.ru/g' /etc/nginx/sites-available/wedding
sudo ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/

# Проверить и применить
sudo nginx -t && sudo systemctl reload nginx

# SSL через Certbot
sudo certbot --nginx -d wedding.ваш-домен.ru --email ваш@email.ru --agree-tos -n
```

### Настроить и запустить приложение

```bash
cd /var/www/wedding_invitations

cp .env.example .env
nano .env   # заполнить DATABASE_URL, ADMIN_PASSWORD, APP_BASE_URL

# Установить зависимости
pnpm install --frozen-lockfile

# Инициализировать БД
export $(grep -v '^#' .env | xargs)
pnpm db:push

# Собрать production-сборку
pnpm build:prod

# Запустить через PM2
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup   # выполнить выведенную команду для автостарта
```

### Полезные команды PM2

```bash
pm2 status                    # статус процессов
pm2 logs wedding-invite       # логи приложения
pm2 restart wedding-invite    # перезапуск
pm2 stop wedding-invite       # остановить
```

---

## Переменные окружения

| Переменная       | Обязательна | Описание                                       |
|------------------|-------------|------------------------------------------------|
| `NODE_ENV`       | да          | Всегда `production`                            |
| `PORT`           | да          | Порт Node.js (обычно `3000`)                  |
| `APP_BASE_URL`   | да          | Полный URL сайта, напр. `https://wedding.ru`  |
| `DOMAIN`         | да (Docker) | Домен без `https://`                          |
| `DATABASE_URL`   | да          | Строка подключения к PostgreSQL               |
| `DB_PASSWORD`    | да (Docker) | Пароль БД (используется в docker-compose)    |
| `ADMIN_PASSWORD` | да          | Пароль для входа в `/admin`                  |
| `SSL_EMAIL`      | да          | Email для SSL-уведомлений Let's Encrypt       |
| `CORS_ORIGIN`    | нет         | Разрешённый CORS-источник (рекомендуется)    |

---

## Структура проекта после сборки

```
dist/
├── server/
│   ├── index.mjs           — главный сервер
│   └── pino-worker.mjs     — логирование
└── public/
    ├── index.html          — точка входа SPA
    └── assets/             — JS, CSS, шрифты (хешированные имена)
```

---

## Маршруты приложения

| Адрес                         | Описание                          |
|-------------------------------|-----------------------------------|
| `/admin`                      | Панель администратора             |
| `/admin/login`                | Вход в панель                     |
| `/invite/:slug`               | Персональное приглашение гостя    |
| `/preview/template/default`   | Предпросмотр: классический шаблон |
| `/preview/template/classic`   | Предпросмотр: элегантный шаблон   |
| `/preview/template/floral`    | Предпросмотр: цветочный шаблон    |
| `/api/healthz`                | Проверка работоспособности API    |

---

## Решение проблем

**Приложение не стартует?**
```bash
docker compose logs app --tail 50
```

**Nginx 502 Bad Gateway?**
```bash
# Проверить, запущен ли контейнер app
docker compose ps
curl http://app:3000/api/healthz   # внутри сети docker
```

**Ошибка подключения к БД?**
```bash
docker compose logs db --tail 20
# Проверить переменную DB_PASSWORD в .env
```

**SSL-сертификат не получен?**
```bash
# Убедитесь что домен указывает на IP сервера:
dig wedding.ваш-домен.ru

# Порт 80 должен быть открыт:
sudo ufw allow 80 && sudo ufw allow 443
```
