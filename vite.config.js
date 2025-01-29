import { defineConfig } from 'vite'

export default defineConfig({
  base: './', // Use relative paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'cannon-es': ['cannon-es']
        }
      }
    }
  },
  resolve: {
    dedupe: ['three', 'cannon-es']
  }
}) 