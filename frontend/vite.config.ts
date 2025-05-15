import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from 'vite-plugin-pwa'
import wasm from "vite-plugin-wasm";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    wasm(),
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,wasm,css,html,svg}'],
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        'short_name': 'Note Mark',
        'icons': [
          {
            'src': '/icon.svg',
            'type': 'image/svg+xml',
            'sizes': '150x150'
          }
        ],
        'start_url': '.',
        'display': 'standalone',
        'scope': '/',
        'theme_color': '#2a76b7',
        'description': 'Lighting Fast & Minimal Markdown Note Taking App'
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
