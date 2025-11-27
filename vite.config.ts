import { defineConfig } from 'vite';

export default defineConfig({
  base: '/WorkoutApp/', // Use repo name for GitHub Pages
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
