import { defineConfig, Plugin } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths'
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import wasm from "vite-plugin-wasm";

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
    tsconfigPaths(),
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
});
