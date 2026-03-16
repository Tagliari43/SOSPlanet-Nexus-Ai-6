import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: false,
        proxy: {
          '/v1/proxy/api.cloudflare.com': {
            target: 'https://api.cloudflare.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/v1\/proxy\/api\.cloudflare\.com/, '')
          },
          '/v1/proxy/router.huggingface.co': {
            target: 'https://router.huggingface.co',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/v1\/proxy\/router\.huggingface\.co/, '')
          },
          '/v1/proxy/api-inference.huggingface.co': {
            target: 'https://api-inference.huggingface.co',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/v1\/proxy\/api-inference\.huggingface\.co/, '')
          }
        }
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        global: 'globalThis'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
