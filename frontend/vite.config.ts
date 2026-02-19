import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// No more tailwind imports here!
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,
    allowedHosts: [
      'constraints-copper-arabia-casino.trycloudflare.com',
      'orchestra-passport-superior-sail.trycloudflare.com',
      '.trycloudflare.com' // Allow all trycloudflare.com subdomains
    ]
  }
});
