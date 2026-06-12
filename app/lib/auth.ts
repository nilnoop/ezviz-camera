export interface LoginUser {
	userId?: string | number;
	loginName?: string;
	userName?: string;
}

export interface AuthSession {
	token: string;
	tokenType: string;
	expireAtEpochSeconds: number;
	user: LoginUser | null;
}

export const AUTH_STORAGE_KEY = "ezviz-camera.auth";

export function getAuthSession(): AuthSession | null {
	if (typeof window === "undefined") {
		return null;
	}

	const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as AuthSession;
		if (!parsed.token || parsed.expireAtEpochSeconds <= nowEpochSeconds()) {
			clearAuthSession();
			return null;
		}
		return parsed;
	} catch {
		clearAuthSession();
		return null;
	}
}

export function setAuthSession(session: AuthSession) {
	window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
	if (typeof window !== "undefined") {
		window.localStorage.removeItem(AUTH_STORAGE_KEY);
	}
}

export function isAuthenticated() {
	return getAuthSession() !== null;
}

function nowEpochSeconds() {
	return Math.floor(Date.now() / 1000);
}
