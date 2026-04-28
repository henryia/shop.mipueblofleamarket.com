// ─── PM2 Ecosystem — shop.mipueblofleamarket.com ─────────────────────────
// Usar en el VPS: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'shop-web',
      cwd: '/var/www/shop.mipueblofleamarket.com/apps/web',
      script: 'node_modules/.bin/next',
      args: 'start',
      instances: 2,  // 2 instancias en KVM4, ajustar según CPU
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      error_file: '/var/log/pm2/shop-web-error.log',
      out_file: '/var/log/pm2/shop-web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'shop-worker',
      cwd: '/var/www/shop.mipueblofleamarket.com/apps/worker',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',  // workers con estado no usan cluster
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
      error_file: '/var/log/pm2/shop-worker-error.log',
      out_file: '/var/log/pm2/shop-worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Reiniciar si cae
      autorestart: true,
      restart_delay: 5000,
    },
  ],
}
