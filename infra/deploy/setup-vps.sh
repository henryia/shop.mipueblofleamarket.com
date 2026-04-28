#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Mi Pueblo Shop — Setup inicial del VPS Hostinger
# IP: 177.7.43.207 | Ubuntu 22.04
# Ejecutar como root: bash setup-vps.sh
# ═══════════════════════════════════════════════════════════════════════════
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Mi Pueblo Shop — Setup VPS Hostinger               ║"
echo "║   $(date)                        ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── 1. ACTUALIZAR SISTEMA ────────────────────────────────────────────────
echo "📦 [1/9] Actualizando sistema Ubuntu..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip build-essential \
  ufw fail2ban \
  nginx certbot python3-certbot-nginx \
  htop nano
echo "✅ Sistema actualizado"

# ─── 2. FIREWALL ──────────────────────────────────────────────────────────
echo ""
echo "🔥 [2/9] Configurando firewall (ufw)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "✅ Firewall activo"

# ─── 3. USUARIO DEPLOY ────────────────────────────────────────────────────
echo ""
echo "👤 [3/9] Creando usuario deploy..."
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG sudo deploy
  echo "deploy:Fl34m4rk3t2026@" | chpasswd
  echo "✅ Usuario 'deploy' creado"
else
  echo "✅ Usuario 'deploy' ya existe"
fi

# ─── 4. NODE.JS 20 + PNPM + PM2 ──────────────────────────────────────────
echo ""
echo "🟢 [4/9] Instalando Node.js 20, pnpm y PM2..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null
  apt-get install -y nodejs
fi
echo "✅ Node.js: $(node -v)"

if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm@9 --quiet
fi
echo "✅ pnpm: $(pnpm -v)"

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2 --quiet
fi
pm2 startup systemd -u deploy --hp /home/deploy 2>/dev/null || true
echo "✅ PM2: $(pm2 -v)"

# ─── 5. POSTGRESQL 16 ─────────────────────────────────────────────────────
echo ""
echo "🐘 [5/9] Instalando PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
    gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
  apt-get update -qq
  apt-get install -y postgresql-16 postgresql-client-16
fi
systemctl enable postgresql
systemctl start postgresql
echo "✅ $(psql --version)"

# Crear usuario y base de datos de producción
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shop') THEN
    CREATE USER shop WITH PASSWORD 'Sh0pPr0d2026!' CREATEDB;
    RAISE NOTICE 'Usuario shop creado';
  ELSE
    RAISE NOTICE 'Usuario shop ya existe';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE shop_prod' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'shop_prod') \gexec
ALTER DATABASE shop_prod OWNER TO shop;
SQL
echo "✅ BD: shop_prod | usuario: shop"

# ─── 6. REDIS 7 ───────────────────────────────────────────────────────────
echo ""
echo "🔴 [6/9] Instalando Redis 7..."
if ! command -v redis-server &>/dev/null; then
  curl -fsSL https://packages.redis.io/gpg | \
    gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/redis.list
  apt-get update -qq
  apt-get install -y redis-server
fi

# Configurar password en Redis
if grep -q "^requirepass" /etc/redis/redis.conf; then
  sed -i 's/^requirepass .*/requirepass R3d1sPr0d2026!/' /etc/redis/redis.conf
else
  echo "requirepass R3d1sPr0d2026!" >> /etc/redis/redis.conf
fi
systemctl enable redis-server
systemctl restart redis-server
echo "✅ $(redis-server --version | head -1)"

# ─── 7. DIRECTORIO DEL PROYECTO ───────────────────────────────────────────
echo ""
echo "📁 [7/9] Preparando directorios..."
mkdir -p /var/www/shop.mipueblofleamarket.com
mkdir -p /var/log/pm2
chown -R deploy:deploy /var/www/shop.mipueblofleamarket.com
chown -R deploy:deploy /var/log/pm2
echo "✅ /var/www/shop.mipueblofleamarket.com listo"

# ─── 8. NGINX ─────────────────────────────────────────────────────────────
echo ""
echo "🌐 [8/9] Configurando Nginx..."
cat > /etc/nginx/sites-available/shop.mipueblofleamarket.com << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name shop.mipueblofleamarket.com 177.7.43.207;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/javascript image/svg+xml;

    location /_next/static/ {
        alias /var/www/shop.mipueblofleamarket.com/apps/web/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    client_max_body_size 110M;
    access_log /var/log/nginx/shop_access.log;
    error_log  /var/log/nginx/shop_error.log;
}
NGINX

ln -sf /etc/nginx/sites-available/shop.mipueblofleamarket.com \
       /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx
echo "✅ Nginx configurado y activo en puerto 80"

# ─── 9. ARCHIVO .ENV DE PRODUCCIÓN ────────────────────────────────────────
echo ""
echo "🔑 [9/9] Creando .env de producción..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > /var/www/shop.mipueblofleamarket.com/.env << ENV
# ══════════════════════════════════════════════════
# shop.mipueblofleamarket.com — Producción
# Generado: $(date)
# ══════════════════════════════════════════════════

NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://shop.mipueblofleamarket.com
NEXT_PUBLIC_APP_NAME="Mi Pueblo Shop"

# Base de datos
DATABASE_URL="postgresql://shop:Sh0pPr0d2026!@localhost:5432/shop_prod?schema=public"
POSTGRES_USER=shop
POSTGRES_PASSWORD=Sh0pPr0d2026!
POSTGRES_DB=shop_prod

# Redis
REDIS_PASSWORD=R3d1sPr0d2026!
REDIS_URL="redis://:R3d1sPr0d2026!@localhost:6379"

# Auth.js
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://shop.mipueblofleamarket.com

# ─── PENDIENTE RELLENAR (Fase 1) ──────────────────
GOOGLE_CLIENT_ID=PENDIENTE
GOOGLE_CLIENT_SECRET=PENDIENTE

# ─── PENDIENTE RELLENAR (Fase 3 — cuando Stripe apruebe) ──
STRIPE_SECRET_KEY=PENDIENTE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=PENDIENTE
STRIPE_WEBHOOK_SECRET=PENDIENTE
PLATFORM_COMMISSION_PCT=10

# ─── PENDIENTE RELLENAR (Fase 2) ──────────────────
CLOUDFLARE_ACCOUNT_ID=PENDIENTE
R2_ACCESS_KEY_ID=PENDIENTE
R2_SECRET_ACCESS_KEY=PENDIENTE
R2_BUCKET_NAME=shop-media
R2_PUBLIC_URL=https://media.shop.mipueblofleamarket.com

# ─── PENDIENTE RELLENAR (Fase 4) ──────────────────
EASYPOST_API_KEY=PENDIENTE

# ─── PENDIENTE RELLENAR (Fase 1) ──────────────────
RESEND_API_KEY=PENDIENTE
EMAIL_FROM="Mi Pueblo Shop <noreply@shop.mipueblofleamarket.com>"

# Feature flags
FEATURE_VIDEO_UPLOAD=true
FEATURE_VENDOR_SHIPS=true
FEATURE_MIPUEBLO_SHIPS=true
FEATURE_TAX_CALCULATION=false
FEATURE_TIKTOK_SHOP=false
ENV

chmod 600 /var/www/shop.mipueblofleamarket.com/.env
chown deploy:deploy /var/www/shop.mipueblofleamarket.com/.env
echo "✅ .env creado (permisos 600)"

# ─── RESUMEN FINAL ────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║             ✅ SETUP COMPLETADO                       ║"
echo "╠══════════════════════════════════════════════════════╣"
printf "║  Node.js:    %-38s║\n" "$(node -v)"
printf "║  pnpm:       %-38s║\n" "$(pnpm -v)"
printf "║  PM2:        %-38s║\n" "$(pm2 -v)"
printf "║  PostgreSQL: %-38s║\n" "$(psql --version | awk '{print $1,$2,$3}')"
printf "║  Nginx:      %-38s║\n" "$(nginx -v 2>&1)"
printf "║  Firewall:   %-38s║\n" "$(ufw status | head -1)"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  BD:     shop_prod @ localhost:5432                  ║"
echo "║  Redis:  localhost:6379 (password configurado)       ║"
echo "║  App:    /var/www/shop.mipueblofleamarket.com        ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  PRÓXIMO PASO: clonar el repo y hacer build          ║"
echo "║  Dile a Claude que el setup terminó para continuar   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
