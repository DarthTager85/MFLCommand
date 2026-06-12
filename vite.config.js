import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static build — deploys free on Vercel hobby tier (output: dist/)
// NOTE: MFL redirects api.myfantasyleague.com to the league's assigned host
// (www42 for league 12691). Proxying straight to that host avoids the
// redirect escaping the proxy and hitting browser CORS. If MFL ever moves
// the league to a different host, update it here AND in vercel.json.
const MFL_HOST = 'https://www42.myfantasyleague.com'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  server: {
    proxy: {
      '/mfl': {
        target: MFL_HOST,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mfl/, ''),
      },
    },
  },
})
