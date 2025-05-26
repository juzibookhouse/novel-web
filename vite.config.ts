import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		allowedHosts: [
			"5173-09liweis-novelweb-w919270jw5c.ws-us119.gitpod.io",
			"c5c840fd-c911-47b5-a397-b9fc1a5a0eaa-00-2rdoxvrphof70.kirk.replit.dev",
		],
	},
});
