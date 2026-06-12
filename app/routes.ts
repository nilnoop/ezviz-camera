import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/index.tsx"),
	route("login", "routes/login.tsx"),
	route("projects", "routes/projects.tsx"),
	route("projects/:projectId/cameras", "routes/cameras.tsx"),
] satisfies RouteConfig;
