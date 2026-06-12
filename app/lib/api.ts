import {
	clearAuthSession,
	getAuthSession,
	type AuthSession,
	type LoginUser,
} from "./auth";
import { encryptPasswordWithPublicKey } from "./crypto";
import { FIXED_PROJECT_ID } from "./projects";

interface ApiEnvelope<T> {
	status: number;
	message: string;
	data: T;
}

interface PublicKeyData {
	publicKey: string;
}

interface LoginData {
	token: string;
	tokenType: string;
	expireAtEpochSeconds: number;
	user: LoginUser | null;
}

export interface CameraLiveAddress {
	url: string | null;
	accessToken: string | null;
	deviceSerial: string | null;
	spaceName: string | null;
	channelNo: number | null;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly httpStatus?: number,
		public readonly apiStatus?: number,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function login(loginName: string, password: string) {
	const publicKey = await request<PublicKeyData>("/auth/public-key", {
		auth: false,
	});
	const encryptedPassword = await encryptPasswordWithPublicKey(
		password,
		publicKey.publicKey,
	);

	const data = await request<LoginData>("/auth/login", {
		auth: false,
		method: "POST",
		body: {
			loginName,
			encryptedPassword,
		},
	});

	return {
		token: data.token,
		tokenType: data.tokenType,
		expireAtEpochSeconds: data.expireAtEpochSeconds,
		user: data.user,
	} satisfies AuthSession;
}

export async function getCameraLiveAddresses(projectId = FIXED_PROJECT_ID) {
	return request<CameraLiveAddress[]>("/miniapp/ys7/video/v1/live/address", {
		method: "POST",
		body: { projectId },
	});
}

interface RequestOptions {
	auth?: boolean;
	method?: "GET" | "POST";
	body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}) {
	const { auth = true, method = "GET", body } = options;
	const baseUrl = getApiBaseUrl();
	const session = auth ? getAuthSession() : null;
	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers: {
			"Content-Type": "application/json",
			...(session ? { Authorization: `Bearer ${session.token}` } : {}),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const envelope = (await response.json().catch(() => null)) as
		| ApiEnvelope<T>
		| null;

	if (response.status === 401) {
		clearAuthSession();
		throw new ApiError("未登录或token已失效", response.status);
	}

	if (!response.ok) {
		throw new ApiError(envelope?.message || "接口请求失败", response.status);
	}

	if (!envelope) {
		throw new ApiError("接口响应为空", response.status);
	}

	if (envelope.status !== 200) {
		throw new ApiError(envelope.message || "接口返回失败", response.status, envelope.status);
	}

	return envelope.data;
}

function getApiBaseUrl() {
	const value = import.meta.env.VITE_API_BASE_URL;
	if (!value) {
		throw new ApiError("未配置 VITE_API_BASE_URL");
	}
	return value.replace(/\/$/, "");
}
