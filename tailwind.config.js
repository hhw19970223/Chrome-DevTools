/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./devtools.html",
    "./panel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // 禁用默认样式，避免与Mantine冲突
  },
}


