import type { Config } from 'tailwindcss'

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind preset — Mi Pueblo Shop
// Paleta basada en mipueblofleamarket.com
// Actualizar colores cuando Henry comparta los hex oficiales (§3 del HANDOFF)
// ─────────────────────────────────────────────────────────────────────────────

const config: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        // ── Variables shadcn/ui (mapean a CSS vars definidas en globals.css) ─
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',
        // ── Marca Mi Pueblo ────────────────────────────────────────────────
        // TODO: reemplazar con los hex exactos del sitio oficial
        brand: {
          50:  '#fef9ec',
          100: '#fdf0c9',
          200: '#fbde8f',
          300: '#f9c64e',
          400: '#f7ad22',
          500: '#f08f0a', // naranja Mi Pueblo (primario)
          600: '#c96a05',
          700: '#a14a08',
          800: '#843a0e',
          900: '#6e3111',
          950: '#3f1805',
        },
        // ── Rojo Mi Pueblo (escala completa para uso directo) ─────────────
        crimson: {
          50:  '#fff1f2',
          100: '#ffe1e3',
          200: '#ffc7cb',
          300: '#ffa0a7',
          400: '#ff6b76',
          500: '#f83b4a',
          600: '#e51d2d', // rojo Mi Pueblo
          700: '#c11220',
          800: '#9f1320',
          900: '#831521',
          950: '#47060c',
        },
        // ── Neutros ──────────────────────────────────────────────────────
        surface: {
          DEFAULT: '#ffffff',
          muted:   '#f8f8f7',
          subtle:  '#f1f0ef',
        },
      },
      fontFamily: {
        // TODO: agregar tipografía oficial de Mi Pueblo cuando Henry comparta
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // Tamaños mínimos de toque (WCAG / mobile-first)
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      screens: {
        // Mobile-first: xs es el breakpoint más pequeño (360px)
        xs: '360px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
