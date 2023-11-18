import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

export default defineConfig({
  plugins: [vue()],
  define: {
    "process.env.VERCEL": process.env.VERCEL,
  },
  server: {
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        raven: resolve(__dirname, "Raven/index.html"),
      },
    },
  },
});
