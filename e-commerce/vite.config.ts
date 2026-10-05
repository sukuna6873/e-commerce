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
  },
});
