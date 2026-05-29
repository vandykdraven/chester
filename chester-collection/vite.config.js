import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // TRIK JITU: Gunakan titik dan garis miring agar jalurnya relatif
  base: './', 
})