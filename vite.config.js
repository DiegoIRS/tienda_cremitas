import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const projectRoot = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(projectRoot, "index.html"),
        preview: resolve(projectRoot, "preview.html"),
        tienda: resolve(projectRoot, "tienda.html"),
        detalleProducto: resolve(projectRoot, "detalle-producto.html"),
        carrito: resolve(projectRoot, "carrito.html"),
        login: resolve(projectRoot, "login.html"),
        perfil: resolve(projectRoot, "perfil.html"),
        diagnostico: resolve(projectRoot, "diagnostico.html"),
        admin: resolve(projectRoot, "admin.html")
      }
    }
  }
});
