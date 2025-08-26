import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative paths so deployment under /<repo>/ works without changing base per repo name
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
