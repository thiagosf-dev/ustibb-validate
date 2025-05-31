// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx,js,jsx}', './index.html'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-animate')],
}
