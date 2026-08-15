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
    // Montar la portada baja el trozo de la carta y transforma su json: el
    // primer montaje de cada idioma se acerca a los 5 s por defecto de vitest,
    // y lo que salta ahi no es un fallo sino la maquina.
    testTimeout: 20000,
    setupFiles: './tests/setup.js',
    include: ['tests/**/*.test.{js,jsx}'],
  },
});
