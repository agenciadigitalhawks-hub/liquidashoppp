/** @type {import('tailwindcss').Config} */
// Config exclusiva da pagina carta/carta (Cartas Premiadas).
//
// Por que separada do tailwind.config.js:
//   - o config principal varre apenas ./loja e ./back2;
//   - a carta usa cores proprias (shopee/gold) que nao existem no tema
//     compartilhado, e antes vinham de um tailwind.config inline no HTML.
//
// Para recompilar apos mexer no HTML da carta:
//   npx tailwindcss -c carta.config.js -i assets/tailwind.src.css -o assets/carta.css --minify
module.exports = {
  content: ["./carta/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        shopee: '#EE4D2D',
        'shopee-dark': '#D4441F',
        'shopee-light': '#FF6B4A',
        gold: '#FFD700',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
}
