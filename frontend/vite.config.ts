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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-tabs'],
          utils: ['axios', 'date-fns', 'clsx', 'tailwind-merge']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Increase warning limit to 1MB
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5173,
    allowedHosts: [

    ]
  }
});
