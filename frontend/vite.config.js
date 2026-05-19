import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(FRONTEND_PORT),
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
