import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Força o servidor de desenvolvimento a escutar em IPv4 (127.0.0.1)
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173
  }
})
