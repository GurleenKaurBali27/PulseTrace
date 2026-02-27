import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root .env file
dotenv.config({ path: path.join(import.meta.dirname, "../.env") });

const API_URL = process.env.VITE_API_URL || "http://localhost:5000";
const CLIENT_PORT = parseInt(process.env.CLIENT_PORT) || 5173;

export default defineConfig({
  plugins: [react()],
  server: {
    port: CLIENT_PORT,
    strictPort: false,
    proxy: {
      "/logs": {
        target: API_URL,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: CLIENT_PORT
  }
});
