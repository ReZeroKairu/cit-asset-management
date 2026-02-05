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
});
