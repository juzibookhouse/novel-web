import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';


export default defineConfig({
	plugins: [tailwindcss(),sveltekit()],
	server: {
		allowedHosts:['5173-09liweis-novelweb-3vt5cm0bby0.ws-us118.gitpod.io']
	}
});
