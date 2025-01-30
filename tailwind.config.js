// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.svelte', // Adjust this to your SvelteKit structure
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
}
