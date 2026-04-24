import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // injectManifest: usamos nosso próprio SW com lógica de push
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "LoveQuest",
        short_name: "LoveQuest",
        description: "Transforme hábitos em conquistas a dois",
        theme_color: "#ff4d6d",
        background_color: "#0f0f0f",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app",
        scope: "/",
        id: "/app",
        icons: [
          {
            src: "/icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        shortcuts: [
          {
            name: "Missões",
            url: "/app/missoes",
            icons: [{ src: "/icon.png", sizes: "96x96" }],
          },
          {
            name: "Recompensas",
            url: "/app/recompensas",
            icons: [{ src: "/icon.png", sizes: "96x96" }],
          },
        ],
      },
      injectManifest: {
        injectionPoint: "self.__WB_MANIFEST",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      devOptions: {
        // Habilita PWA em desenvolvimento para testar SW
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
