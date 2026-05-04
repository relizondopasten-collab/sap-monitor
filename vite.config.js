import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Sap & Soil · Monitoreo nutricional",
        short_name: "Sap & Soil",
        description: "Registro y diagnóstico de savia y solución de suelo en tomate de invernadero",
        theme_color: "#2D4A2B",
        background_color: "#F5F1E6",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "es-CL",
        icons: [
          { src: "pwa-192x192.png",          sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png",          sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webp,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          { urlPattern: /^https:\/\/.*\.supabase\.co\//, handler: "NetworkOnly" }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  server: { port: 5174, strictPort: true }
});