import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
build: {
    chunkSizeWarningLimit: 1600, // Aumenta o limite do aviso para não poluir o terminal
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa as bibliotecas pesadas em arquivos diferentes
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('lucide-react')) {
              return 'lucide';
            }
            // O restante vai para um arquivo vendor
            return 'vendor';
          }
        },
      },
    },
  },
})