/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0e17',
          900: '#0f1523',
          800: '#161e30',
          700: '#1f2a42',
          600: '#2b3a5c',
        },
        accent: {
          DEFAULT: '#22d3ee',
          dim: '#0e7490',
        },
        winnow: '#f59e0b',
        rebuild: '#a78bfa',
      },
    },
  },
  plugins: [],
}
