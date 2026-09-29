import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()], base: '/portfolio/', build: { rollupOptions: { input: { portfolio: 'index.html', admin: 'admin/index.html' } } } });
