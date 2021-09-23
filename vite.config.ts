import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';



// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir:'./lib',
    lib: {
      
      entry: './index.ts',
      name: 'MarkUI',
      formats: ["cjs",'es','umd']
    },
  },
  
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  plugins: [
    vue(),
  ]
})
