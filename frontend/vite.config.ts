import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    wasm(),
    solidPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'es2022',
  },
});
