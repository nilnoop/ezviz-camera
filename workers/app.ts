import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

async function recordEzvizCallback(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const query = url.search.startsWith("?") ? url.search.slice(1) : "";
	const body = await request.text();

	try {
		await env.CALLBACK_DB.prepare(
			"INSERT INTO ezviz_callback_records (query, body) VALUES (?, ?)",
		)
			.bind(query, body)
			.run();
	} catch (error) {
		console.error("Failed to record EZVIZ callback", error);
	}

	return Response.json({ code: "200" });
}

export default {
	fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (url.pathname === "/api/ezviz/callback") {
			return recordEzvizCallback(request, env);
		}

		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
