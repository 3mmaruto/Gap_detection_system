import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    // server: {
    //     host: '0.0.0.0', // Listens on all addresses, including LAN
    //     // port: 5173,   // Optional: specify a port (default is 5173)
    // },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
