import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      external: [],
      output: {
        format: 'es'
      }
    }
  },
  resolve: {
    dedupe: ['three', 'cannon-es']
  }
}) 