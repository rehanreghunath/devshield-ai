import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50:  'hsl(220 100% 97%)',
          100: 'hsl(220 96% 93%)',
          200: 'hsl(220 90% 84%)',
          300: 'hsl(220 84% 72%)',
          400: 'hsl(220 78% 58%)',
          500: 'hsl(220 72% 46%)',
          600: 'hsl(220 68% 38%)',
          700: 'hsl(220 64% 30%)',
          800: 'hsl(220 60% 22%)',
          900: 'hsl(220 56% 14%)',
        },
        surface: {
          base:  'hsl(222 20% 7%)',
          card:  'hsl(222 18% 11%)',
          hover: 'hsl(222 16% 15%)',
          border:'hsl(222 14% 20%)',
        },
        severity: {
          critical: 'hsl(0 84% 60%)',
          high:     'hsl(25 90% 55%)',
          medium:   'hsl(43 96% 56%)',
          low:      'hsl(145 64% 50%)',
        }
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.3s ease-out',
        'pulse-ring':     'pulse-ring 1.5s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
