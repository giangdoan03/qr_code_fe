import {fileURLToPath, URL} from 'node:url'

import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
    ],
    base: '/', // quan trọng để đúng path
    server: {
        host: 'giang.test',
        port: 5173,
    },
    proxy: {
        '/api': {
            target: 'http://api.goldenwin.com',
            changeOrigin: true,
            credentials: true,
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },
    optimizeDeps: {
        include: ['quill']
    }
})