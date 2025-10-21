import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  base: './', // Importante para caminhos relativos no Electron
  publicDir: 'public',
  build: {
    assetsDir: 'assets',
  },
});
