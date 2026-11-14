import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_ROUTES = [
  '/health',
  '/catalog',
  '/missions',
  '/evaluate',
  '/fly',
  '/ops',
  '/advise',
  '/validity',
  '/campaign',
];

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: Object.fromEntries(
      BACKEND_ROUTES.map((route) => [
        route,
        {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      ])
    ),
  },
});
