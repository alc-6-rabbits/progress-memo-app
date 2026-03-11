import path from 'node:path'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    'nuxt-electron'
  ],
  electron: {
    disableDefaultOptions: true,
    build: [
      {
        entry: 'electron/main.ts',
      },
      {
        entry: 'electron/preload.mjs',
        onstart(options: any) {
          options.reload()
        }
      }
    ],
  },
  app: {
    baseURL: './',
    buildAssetsDir: 'assets/'
  },
  experimental: {
    payloadExtraction: false,
    appManifest: false
  },
  vite: {
    // Force Vite to use relative paths for built assets
    base: './'
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  ssr: false, // Required for Electron
  router: {
    options: {
      hashMode: true
    }
  },
  nitro: {
    preset: 'node-server',
    output: {
      publicDir: path.join(process.cwd(), 'dist')
    }
  },
  hooks: {
    'close': async (nuxt) => {
      // Electron needs relative paths for local file:// execution.
      // Nuxt 3 generate forces absolute paths ('/' or baseURL).
      // We manually replace them in the generated index.html.
      const fs = await import('node:fs')
      const targetPath = path.join(process.cwd(), 'dist', 'index.html')
      if (fs.existsSync(targetPath)) {
        let html = fs.readFileSync(targetPath, 'utf-8')
        html = html.replace(/src="\/assets\//g, 'src="./assets/')
        html = html.replace(/href="\/assets\//g, 'href="./assets/')
        fs.writeFileSync(targetPath, html, 'utf-8')
        console.log('[Nuxt Hooks] Replaced absolute asset paths with relative paths in index.html for Electron compatibility.')
      }
    }
  }
})

