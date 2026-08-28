import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        preview: resolve(__dirname, "preview.html"),
        tienda: resolve(__dirname, "tienda.html"),
        detalleProducto: resolve(__dirname, "detalle-producto.html"),
        carrito: resolve(__dirname, "carrito.html"),
        login: resolve(__dirname, "login.html"),
        admin: resolve(__dirname, "admin.html")
      }
    }
  }
});
