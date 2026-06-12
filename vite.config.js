import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static build — deploys free on Vercel hobby tier (output: dist/)
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    // Local dev: proxy /mfl/* to the MFL API to avoid browser CORS blocks.
    // In production the same path is handled by the rewrite in vercel.json.
    proxy: {
      '/mfl': {
        target: 'https://api.myfantasyleague.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mfl/, ''),
      },
    },
  },
})
