import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import jsx from '@vitejs/plugin-vue-jsx';
import { visualizer } from 'rollup-plugin-visualizer';

// import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: './dist',
    minify: false,
    lib: {

      entry: './src/index.ts',
      name: 'MarkUI',

    },
    rollupOptions: {
      external: ["vue", 'highlight.js', 'markdownit'],
      output:
        [
          { format: 'esm', dir: './dist/esm' },
          { format: 'cjs', dir: './dist/cjs' },
          // {
          //   format: 'esm',
          //   dir: './dist/esm',
          //   manualChunks(id) {
          //     if (id.includes('markdown')) {
          //       return 'markdown'
          //     } else if (id.includes('highlight')) {
          //       return 'highlight'
          //     } else if (id.includes('node_modules')) {
          //       return 'vendor'
          //     }
          //     else if (id.includes('src')) {
          //       const url = id.replace(path.resolve('./src/').replace(/\\/g, '/'), '')
          //       return url.substring(1, url.lastIndexOf('.') || url.length);
          //     }
          //   }
          // }
        ]


    }
  },

  plugins: [
    vue(),
    jsx(),
    visualizer()
  ]
})
