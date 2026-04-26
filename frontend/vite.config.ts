import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/external/ndl': {
        target: 'https://ndlsearch.ndl.go.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external\/ndl/, ''),
      },
      '/external/google': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external\/google/, ''),
      },
      '/external/openbd': {
        target: 'https://api.openbd.jp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external\/openbd/, ''),
      },
      '/external/openlibrary': {
        target: 'https://openlibrary.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external\/openlibrary/, ''),
      },
      '/external/books-image': {
        target: 'https://thumbnail-s.images.books.or.jp',
        changeOrigin: true,
        headers: {
          Referer: 'https://www.books.or.jp/',
          'User-Agent': 'Mozilla/5.0',
        },
        rewrite: (path) => path.replace(/^\/external\/books-image/, ''),
      },
    },
  },
})
