/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["index.html", "./door/**/*.{html,js,vue,ts}"],
  theme: {
    extend: {},
    container: {
      center: true,
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["retro"],
  },
};
