/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090A0F',
          subtle: '#0D0F17',
          card: '#121420',
          elevated: '#1A1C2E',
          hover: '#22253B',
        },
        lavender: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#9D8CFC',
          600: '#7C66DC',
          700: '#604BB4',
          800: '#4C3B8F',
          900: '#342962',
          DEFAULT: '#9D8CFC',
          light: '#B3A5FF',
          glow: 'rgba(157, 140, 252, 0.35)',
        },
        dark: {
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(157, 140, 252, 0.3)',
          'border-active': 'rgba(157, 140, 252, 0.6)',
          text: '#F1F1F8',
          muted: '#9496B8',
          dim: '#5E6188',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(157, 140, 252, 0.25)',
        'glow': '0 0 25px -5px rgba(157, 140, 252, 0.35)',
        'glow-lg': '0 0 40px -10px rgba(157, 140, 252, 0.45)',
        'card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
}
