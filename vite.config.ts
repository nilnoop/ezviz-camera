import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	if (mode === "production" && !env.VITE_API_BASE_URL) {
		process.env.VITE_API_BASE_URL = "/api";
	}

	return {
		plugins: [
			cloudflare({ viteEnvironment: { name: "ssr" } }),
			tailwindcss(),
			reactRouter(),
			tsconfigPaths(),
		],
	};
});
