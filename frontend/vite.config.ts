import { defineConfig, Plugin } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import wasm from "vite-plugin-wasm";
import { VitePWA } from 'vite-plugin-pwa'

function apiProxyPlugin(): Plugin {
  return {
    name: "api-proxy",
    configureServer(server) {
      server.config.server.proxy = {
        "/api": {
          target: "http://127.0.0.1:8080",
        },
      }
    },
  }
}

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ['**/*.{js,wasm,css,html,svg}'],
        navigateFallbackDenylist: [/^\/api/],
      },
      manifest: {
        short_name: "Note Mark",
        "icons": [
          {
            "src": "/icon.svg",
            "type": "image/svg+xml",
            "sizes": "150x150",
          }
        ],
        start_url: ".",
        display: "standalone",
        scope: "/",
        description: "Lighting Fast & Minimal Markdown Note Taking App",
        theme_color: "#0c0c0c",
        shortcuts: [
          {
            "name": "Scratch Pad",
            "url": "/scratch-pad",
          },
        ],
      },
    }),
    tailwindcss(),
    wasm(),
    solidPlugin(),
    apiProxyPlugin(),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'es2022',
  },
  resolve: {
    tsconfigPaths: true,
  }
});
