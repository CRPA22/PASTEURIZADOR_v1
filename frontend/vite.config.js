import { defineConfig } from 'vite';

export default defineConfig({
    base: '/static/',
    build: {
        outDir: '../backend/src/static',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                entryFileNames: 'assets/main.js',
                assetFileNames: 'assets/main.css'
            }
        }
    }
});