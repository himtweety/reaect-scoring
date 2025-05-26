import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Offline Scoreboard",
        short_name: "Scoreboard",
        description: "A custom offline-capable scoreboard app",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
           {
            "src": "/web-app-manifest-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "maskable"
          },
          {
            "src": "/web-app-manifest-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
          }
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
