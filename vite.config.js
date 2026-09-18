import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  if (command === 'build' && process.env.VERCEL === '1') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const value = (process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL ?? '').trim()
    let url
    try {
      url = new URL(value)
    } catch {
      throw new Error('Set VITE_API_BASE_URL to your public HTTPS backend URL in Vercel Environment Variables before deploying.')
    }
    const host = url.hostname
    const localHost = host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '[::1]' || host === '0.0.0.0' || /^127\./.test(host) || /^10\./.test(host) ||
      /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    if (url.protocol !== 'https:' || localHost || url.username || url.password || url.search || url.hash) {
      throw new Error('VITE_API_BASE_URL must be a public HTTPS backend URL without credentials, query parameters, or a fragment.')
    }
  }
  return { plugins: [react()] }
})
