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
        champagne: {
          50: '#fdfbf7',
          100: '#f8f4eb',
          200: '#f0e6d2',
          300: '#e5d3b3',
          400: '#d5ba89',
          500: '#c59d5f',
          600: '#af834a',
          700: '#8e6539',
          800: '#735132',
          900: '#5e432b',
        },
        onyx: {
          800: '#1a2233',
          850: '#141b29',
          900: '#0f1522',
          950: '#0a0d14',
        },
        brand: {
          50: '#f0fdf9',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        gold: {
          400: '#e5b95c',
          500: '#c59d5f',
          600: '#aa7f43',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-champagne': '0 0 30px rgba(197, 157, 95, 0.35)',
        'glow-gold': '0 0 25px rgba(229, 185, 92, 0.35)',
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.3)',
        'glass-luxury': '0 12px 40px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
