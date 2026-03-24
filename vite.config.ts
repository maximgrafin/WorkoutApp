import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/WorkoutApp/', // Use repo name for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: false, // Optional: disable sourcemaps for a cleaner build
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*(tailwindcss|googleapis|aistudiocdn|esm\.sh|giphy|imgur|shopify|sportydoctor|makeagif|runnersworld|powrpersonaltraining|nourishmovelove).*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  // Pass compiler options to esbuild to support Angular features.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false, // Must be false for Angular DI to work
      },
    },
  },
});
