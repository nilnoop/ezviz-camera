import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getAuthSession, type AuthSession } from "../lib/auth";

export function useRequireAuth() {
	const navigate = useNavigate();
	const [session, setSession] = useState<AuthSession | null>(null);
	const [checking, setChecking] = useState(true);

	useEffect(() => {
		const current = getAuthSession();
		if (!current) {
			navigate("/login", { replace: true });
			return;
		}

		setSession(current);
		setChecking(false);
	}, [navigate]);

	return { session, checking };
}

export function useRedirectAuthedUser() {
	const navigate = useNavigate();

	useEffect(() => {
		if (getAuthSession()) {
			navigate("/projects", { replace: true });
		}
	}, [navigate]);
}
