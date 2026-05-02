import { fail, redirect } from "@sveltejs/kit";

import {
	ACCESS_COOKIE,
	ACCESS_TTL_S,
	isSoftLaunchActive,
	issueAccessCookie,
	verifyPassword,
} from "$lib/server/access";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// /unlock is only meaningful when soft-launch mode is on. In production
	// (no EARLY_ACCESS_PASSWORD), bounce to home so the route can't be
	// stumbled into.
	if (!isSoftLaunchActive()) throw redirect(302, "/");
	return {};
};

export const actions: Actions = {
	default: async ({ cookies, request, url }) => {
		const data = await request.formData();
		const password = String(data.get("password") ?? "");
		if (!verifyPassword(password)) {
			return fail(401, { error: "Wrong password." });
		}
		cookies.set(ACCESS_COOKIE, issueAccessCookie(), {
			path: "/",
			httpOnly: true,
			sameSite: "lax",
			secure: url.protocol === "https:",
			maxAge: ACCESS_TTL_S,
		});
		throw redirect(303, sanitizeNext(url.searchParams.get("next")));
	},
};

// Same-origin paths only: avoids open-redirect via crafted ?next=... links.
function sanitizeNext(s: string | null): string {
	if (!s) return "/";
	if (!s.startsWith("/")) return "/";
	if (s.startsWith("//")) return "/";
	return s;
}
