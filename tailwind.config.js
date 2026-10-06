/** @type {import('tailwindcss').Config} */
module.exports = {
  // Varre TODAS as paginas servidas (home + produtos) e os JS que injetam markup.
  // A pasta _inativos nao entra: nao vai pro ar (ver .vercelignore).
  content: [
    "./loja/**/*.{html,js}",
    "./back2/**/*.{html,js}",
  ],
  // Classes montadas em runtime via template literal, que o scanner nao enxerga.
  safelist: [
    "aspect-[16/9]",
    "aspect-[9/16]",
    "aspect-[4/3]",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f8ff', 100:'#eaefff', 200:'#d6dfff', 300:'#b7c7ff',
          400:'#8fa6ff', 500:'#5f7dff', 600:'#3c5dff', 700:'#2e47d6',
          800:'#2539aa', 900:'#1f3088'
        }
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,.12)'
      }
    }
  },
  darkMode: 'class',
  plugins: [],
}
