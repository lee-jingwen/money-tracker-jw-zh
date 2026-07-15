import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path must match the GitHub repo name so assets resolve correctly
// on GitHub Pages at https://<user>.github.io/money-tracker-jw-zh/
export default defineConfig({
  base: '/money-tracker-jw-zh/',
  plugins: [react(), tailwindcss()],
})
