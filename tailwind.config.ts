import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        stone: {
          950: '#08090d',
          900: '#0d1016',
          850: '#11151d',
          800: '#171c25',
        },
        concrete: {
          100: '#f3efe8',
          200: '#e6dfd1',
          300: '#d7d1c4',
          400: '#b9b3a8',
          500: '#9aa3b2',
          700: '#596273',
          900: '#232a38',
        },
        moai: {
          300: '#b5ad9b',
          500: '#847a68',
          700: '#565044',
          900: '#2d2923',
        },
        mint: {
          300: '#8cf0da',
          500: '#20c997',
          700: '#0b7e63',
        },
        amber: {
          300: '#ffd68f',
          500: '#f6a742',
          700: '#a46414',
        },
      },
      fontFamily: {
        sans: ['"Sora"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(32, 201, 151, 0.22)',
        panel: '0 18px 50px rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.65, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.02)' },
        },
      },
      animation: {
        floaty: 'floaty 8s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;