import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for assets, crucial for GitHub Pages.
  build: {
    outDir: 'dist',
    sourcemap: false, // Optional: disable sourcemaps for a cleaner build
  },
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
