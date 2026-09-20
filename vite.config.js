import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, isPreview }) => ({
	plugins: [react()],
	// Keep local development at /; build and preview at the GitHub Pages project path.
	base: command === 'build' || isPreview ? '/naruto-uzumaki/' : '/',
}))