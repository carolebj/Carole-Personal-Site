import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const readJsonBody = async (request: import('node:http').IncomingMessage) => {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

export default defineConfig({
  plugins: [
    {
      name: 'carole-admin-dev-redirect',
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          if (request.url === '/api/translate' && request.method === 'OPTIONS') {
            response.statusCode = 204
            response.setHeader('Access-Control-Allow-Origin', '*')
            response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            response.end()
            return
          }

          if (request.url === '/api/translate' && request.method === 'POST') {
            response.setHeader('Access-Control-Allow-Origin', '*')
            response.setHeader('Content-Type', 'application/json')

            try {
              const body = await readJsonBody(request)
              const text = typeof body?.text === 'string' ? body.text.trim() : ''

              if (!text) {
                response.statusCode = 400
                response.end(JSON.stringify({ error: 'Aucun texte français à traduire.' }))
                return
              }

              const { translateToEnglish } = await import('./scripts/translate-text.mjs')
              const translation = await translateToEnglish({ text, format: body?.format })

              response.statusCode = 200
              response.end(JSON.stringify({ translation }))
            } catch (error) {
              response.statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number(error.statusCode) : 500
              response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur de traduction.' }))
            }

            return
          }

          if (request.url === '/admin' || request.url?.startsWith('/admin/')) {
            const targetPath = request.url === '/admin' ? '/admin/' : request.url
            response.statusCode = 302
            response.setHeader('Location', `http://127.0.0.1:3333${targetPath}`)
            response.end()
            return
          }

          next()
        })
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }

          if (id.includes('/react-router/')) {
            return 'vendor-router'
          }

          if (id.includes('/motion/')) {
            return 'vendor-motion'
          }

          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'vendor-i18n'
          }

          if (id.includes('/@sanity/client/') || id.includes('/@sanity/image-url/')) {
            return 'vendor-sanity'
          }

          if (id.includes('/@heroicons/')) {
            return 'vendor-icons'
          }

          return undefined
        },
      },
    },
  },
  // In dev, /admin redirects to the Studio server started by `npm run dev`.

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
