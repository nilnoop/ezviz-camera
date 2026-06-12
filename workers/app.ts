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

const API_PROXY_PREFIX = "/api";

export default {
	fetch(request, env, ctx) {
		const apiResponse = proxyApiRequest(request, env);
		if (apiResponse) {
			return apiResponse;
		}

		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;

function proxyApiRequest(request: Request, env: Env) {
	const requestUrl = new URL(request.url);
	if (!isApiProxyPath(requestUrl.pathname)) {
		return null;
	}

	if (!env.API_ORIGIN) {
		return new Response("API_ORIGIN is not configured", { status: 500 });
	}

	let targetUrl: URL;
	try {
		targetUrl = buildApiTargetUrl(env.API_ORIGIN, requestUrl);
	} catch {
		return new Response("API_ORIGIN is invalid", { status: 500 });
	}

	return fetch(targetUrl, {
		method: request.method,
		headers: buildProxyHeaders(request),
		body: hasRequestBody(request) ? request.body : undefined,
	});
}

function isApiProxyPath(pathname: string) {
	return pathname === API_PROXY_PREFIX || pathname.startsWith(`${API_PROXY_PREFIX}/`);
}

function buildApiTargetUrl(apiOrigin: string, requestUrl: URL) {
	const originUrl = new URL(apiOrigin);
	const apiPath = requestUrl.pathname.slice(API_PROXY_PREFIX.length);
	const originPath = originUrl.pathname.replace(/\/$/, "");

	originUrl.pathname = `${originPath}${apiPath || "/"}`;
	originUrl.search = requestUrl.search;
	return originUrl;
}

function buildProxyHeaders(request: Request) {
	const headers = new Headers(request.headers);
	headers.delete("host");
	return headers;
}

function hasRequestBody(request: Request) {
	return request.method !== "GET" && request.method !== "HEAD";
}
