import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            // Ensure service worker and manifest are copied correctly
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'sw.js' || assetInfo.name === 'manifest.json') {
                return '[name][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      },
      publicDir: 'public'
    };
});
