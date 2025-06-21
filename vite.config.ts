/// <reference types="vitest" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
	plugins: [preact(), tailwindcss()],
	base: command === 'serve' ? '/' : '/srt-translator/',
	test: {
		globals: true,
		environment: 'jsdom',
	},
}));
