import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "eb93650b-b92e-4ccb-9364-d7df8d13babe-00-3imvsbeiig90i.sisko.replit.dev",
    ],
    // Admin auth is the only feature that talks to the backend. Proxying keeps
    // the browser on one origin, so the token never crosses a CORS boundary.
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET ?? "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
