import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds the TV screen into one script and one stylesheet next to the game,
// so heads-up.html can load them like any other local file (no server code, no CDN).
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  // The light Lottie player draws SVG only and has no eval(); the emoji animations need nothing more.
  resolve: { alias: { 'lottie-web': 'lottie-web/build/player/lottie_light.js' } },
  build: {
    outDir: '../heads-up/tv',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    lib: {
      entry: 'src/main.tsx',
      formats: ['iife'],
      name: 'HeadsUpTV',
      fileName: () => 'tv-app.js'
    },
    rollupOptions: {
      output: { assetFileNames: 'tv-app[extname]' }
    }
  }
});
