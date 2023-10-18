import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import wasmPack from 'vite-plugin-wasm-pack';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    wasmPack(["./renderer"]),
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ["manifest.json"],
      workbox: {
        globPatterns: ['**/*.{js,wasm,css,html,svg}']
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
