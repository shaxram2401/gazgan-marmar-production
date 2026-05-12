import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        graphite: '#1c1c1c',
        line: '#e6e6e6',
        muted: '#6b6b6b',
        paper: '#fafaf8',
        gold: { DEFAULT: '#b08d4f', light: '#c9a76a', dark: '#8e6f3a' }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'ui-serif', 'Georgia'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 24px 60px -30px rgba(0,0,0,.18)',
        card: '0 1px 0 rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.08)'
      },
      animation: {
        'fade-in': 'fadeIn .35s ease-out',
        'slide-up': 'slideUp .35s ease-out'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } }
      }
    }
  },
  plugins: []
};
export default config;
