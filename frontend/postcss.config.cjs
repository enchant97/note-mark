/** @type {import('postcss-load-config').Config} */
const config = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

module.exports = config
