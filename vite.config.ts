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
          '/v1/proxy/api.groq.com': {
            target: 'https://api.groq.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/v1\/proxy\/api\.groq\.com/, '')
          }
        }
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.CLOUDFLARE_API_TOKEN': JSON.stringify(env.CLOUDFLARE_API_TOKEN),
        'process.env.CLOUDFLARE_ACCOUNT_ID': JSON.stringify(env.CLOUDFLARE_ACCOUNT_ID),
        'process.env.ID_DA_CONTA_CLOUDFLARE': JSON.stringify(env.ID_DA_CONTA_CLOUDFLARE),
        'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
        'process.env.SCRAPER_API_KEY': JSON.stringify(env.SCRAPER_API_KEY),
        'process.env.GITHUB_TOKEN': JSON.stringify(env.GITHUB_TOKEN),
        'process.env.TAVILY_API_KEY': JSON.stringify(env.TAVILY_API_KEY),
        global: 'globalThis'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
