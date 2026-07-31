import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "VITE_");
  const apiOrigin = env.VITE_API_ORIGIN ?? "http://localhost:8000";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": new URL("./src", import.meta.url).pathname },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": { target: apiOrigin, changeOrigin: true },
      },
    },
    preview: { port: 4173, strictPort: true },
    build: {
      target: "es2023",
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("@tanstack")) return "query";
            if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return "react";
            return "vendor";
          },
        },
      },
    },
  };
});
