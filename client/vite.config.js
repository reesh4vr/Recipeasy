import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const stripApiSuffix = (url = '') => url.replace(/\/+$/, '').replace(/\/api$/, '')

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_API_PROXY_TARGET ||
    (env.VITE_API_BASE_URL ? stripApiSuffix(env.VITE_API_BASE_URL) : 'http://localhost:5000')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})

