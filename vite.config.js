import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base para GitHub Pages: la web vive en /cafediagon/, no en la raiz.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/cafediagon/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Sin una URL real jsdom usa un origen opaco y localStorage no existe.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    globals: true,
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
