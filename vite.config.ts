import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: [
			"5173-09liweis-novelweb-w919270jw5c.ws-us120.gitpod.io",
			"641ad0fa-cc90-43aa-9f32-9432321f99f5-00-12ffk0ze4fl22.kirk.replit.dev",
		],
	},
});
