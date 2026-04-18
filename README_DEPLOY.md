# Deployment Guide — Wedding Invitation App

Production deployment on a regular VPS / dedicated server.

---

## Requirements

- **OS**: Ubuntu 22.04+ / Debian 12+ (or any modern Linux)
- **Node.js**: 20 LTS or 22 LTS (`node --version`)
- **pnpm**: 9+ (`npm i -g pnpm`)
- **PostgreSQL**: 15+ (local or remote)
- **Nginx**: for reverse proxy and SSL
- **PM2**: `npm i -g pm2`
- **Certbot**: for free SSL via Let's Encrypt

---

## Option A — VPS deployment (without Docker)

### Step 1 — Upload the project to your server

```bash
# On your server, create app directory
mkdir -p /var/www/wedding
cd /var/www/wedding

# Option 1: clone from Git
git clone https://YOUR_REPO_URL .

# Option 2: extract from archive
# tar -xzf wedding-app.tar.gz
```

### Step 2 — Install Node.js and pnpm

```bash
# Install Node.js 22 via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Install pnpm
npm i -g pnpm pm2
```

### Step 3 — Configure PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql -c "CREATE USER wedding_user WITH PASSWORD 'strongpassword';"
sudo -u postgres psql -c "CREATE DATABASE wedding_db OWNER wedding_user;"
```

### Step 4 — Set up environment variables

```bash
cd /var/www/wedding
cp .env.example .env
nano .env
```

Fill in your values:

```env
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://wedding.yourdomain.com
DATABASE_URL=postgresql://wedding_user:strongpassword@localhost:5432/wedding_db
ADMIN_PASSWORD=your_strong_admin_password
CORS_ORIGIN=https://wedding.yourdomain.com
```

### Step 5 — Install dependencies

```bash
pnpm install --frozen-lockfile
```

### Step 6 — Run database migrations

```bash
# This creates all tables automatically (safe to run multiple times)
DATABASE_URL="postgresql://wedding_user:strongpassword@localhost:5432/wedding_db" pnpm db:push
```

Or source your .env first:

```bash
export $(grep -v '^#' .env | xargs)
pnpm db:push
```

### Step 7 — Build the project

```bash
pnpm build:prod
```

This creates:
```
dist/
├── server/    — Node.js bundle
└── public/    — Frontend static files
```

### Step 8 — Start with PM2

```bash
# Source .env so PM2 has all variables
export $(grep -v '^#' .env | xargs)

# Start the app
pm2 start ecosystem.config.cjs --env production

# Save PM2 process list
pm2 save

# Auto-start PM2 on server reboot
pm2 startup
# Follow the printed command (usually: sudo env PATH=... pm2 startup systemd ...)
```

Useful PM2 commands:
```bash
pm2 status          # check status
pm2 logs wedding-invite   # view logs
pm2 restart wedding-invite
pm2 stop wedding-invite
```

### Step 9 — Configure Nginx

```bash
sudo apt install nginx -y

# Copy the example config
sudo cp /var/www/wedding/deploy/nginx.conf /etc/nginx/sites-available/wedding

# Edit it — replace YOUR_DOMAIN with your real domain
sudo nano /etc/nginx/sites-available/wedding

# Enable the site
sudo ln -s /etc/nginx/sites-available/wedding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 10 — Enable SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y

# Issue certificate (replace with your domain and email)
sudo certbot --nginx -d wedding.yourdomain.com -d www.wedding.yourdomain.com \
  --email your@email.com --agree-tos --non-interactive

# Certbot auto-renews. Verify the renewal timer:
sudo systemctl status certbot.timer
```

---

## Option B — Docker deployment

### Step 1 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### Step 2 — Configure environment

```bash
cp .env.example .env
nano .env
# Set DB_PASSWORD (used by docker-compose), APP_BASE_URL, ADMIN_PASSWORD, etc.
```

### Step 3 — Build and start

```bash
docker compose up -d --build
```

### Step 4 — Run database migrations

```bash
docker compose exec app sh -c "DATABASE_URL=\$DATABASE_URL pnpm db:push"
```

### Step 5 — Configure Nginx and SSL

Same as Option A, Steps 9–10, but proxy to port 3000 on the host:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    ...
}
```

### Docker commands

```bash
docker compose up -d          # start (detached)
docker compose down           # stop and remove containers
docker compose logs -f app    # view app logs
docker compose restart app    # restart app container
docker compose pull && docker compose up -d --build   # update
```

---

## Updating the project

```bash
cd /var/www/wedding

# Pull latest code
git pull

# Install any new dependencies
pnpm install --frozen-lockfile

# Re-run migrations if schema changed
export $(grep -v '^#' .env | xargs) && pnpm db:push

# Rebuild
pnpm build:prod

# Restart
pm2 restart wedding-invite
```

---

## Database backup

```bash
# Manual backup
pg_dump -U wedding_user -h localhost wedding_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U wedding_user -h localhost wedding_db < backup_20260101_120000.sql
```

Automate with cron:
```bash
crontab -e
# Add: daily backup at 3am, keep 30 days
0 3 * * * pg_dump -U wedding_user -h localhost wedding_db | gzip > /backups/wedding_$(date +\%Y\%m\%d).sql.gz && find /backups -name 'wedding_*.sql.gz' -mtime +30 -delete
```

---

## Nginx config overview

See `deploy/nginx.conf` for the full example. It includes:
- HTTP → HTTPS redirect
- SSL via Certbot (or your own certificates)
- Static frontend files served directly by Nginx (fast)
- `/api/` routes proxied to Node.js on port 3000
- SPA fallback for client-side routing (`/invite/:slug`, `/admin`, etc.)

---

## Project structure after build

```
dist/
├── server/
│   ├── index.mjs           — Main server entry point
│   └── pino-worker.mjs     — Logging worker
└── public/
    ├── index.html          — SPA entry point
    └── assets/             — JS, CSS, fonts (hashed filenames)
```

---

## Environment variables reference

| Variable        | Required | Description                                      |
|-----------------|----------|--------------------------------------------------|
| `NODE_ENV`      | yes      | Must be `production`                             |
| `PORT`          | yes      | Port for Node.js server (default: 3000)          |
| `APP_BASE_URL`  | yes      | Public URL e.g. `https://wedding.example.com`    |
| `DATABASE_URL`  | yes      | PostgreSQL connection string                     |
| `ADMIN_PASSWORD`| yes      | Password for the admin panel                     |
| `CORS_ORIGIN`   | no       | Allowed CORS origin (defaults to allow all)      |
| `SSL_EMAIL`     | no       | Email for Certbot SSL certificate                |

---

## Troubleshooting

**App not starting?**
```bash
pm2 logs wedding-invite --lines 50
```

**502 Bad Gateway in Nginx?**
```bash
# Check if Node.js is running
pm2 status
curl http://localhost:3000/api/health
```

**Database connection error?**
```bash
# Verify DATABASE_URL
psql "$DATABASE_URL" -c "SELECT 1"
```

**Need to reset admin password?**
```bash
# Update directly in the DB
psql "$DATABASE_URL" -c "UPDATE settings SET admin_password_hash = 'new_hash' WHERE id = 1;"
# Or re-run the app with a new ADMIN_PASSWORD and it will update on next login
```
