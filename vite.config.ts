import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';



// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: './index.ts',
      name: 'MarkUI',
      formats: ["cjs",'es','umd']
    },
    // minify: false,
    rollupOptions: {
      external(source: string, importer: string) {
        return /node_modules/.test(source) || ['vue'].includes(source)
      },
      output: {
        // dir:'./dist',
        // name:'MarkUI',
        // file:'mark-ui.js',
        // assetFileNames: 'assets/[name][extname]',
        // manualChunks(id: string) {
        //   return id.substring(id.lastIndexOf('/') + 1, id.lastIndexOf('.'))
        // }
      }
    }
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') }
  },
  plugins: [
    vue(),
  ]
})
