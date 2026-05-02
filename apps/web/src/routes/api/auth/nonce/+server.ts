import { json } from "@sveltejs/kit";

import {
	NONCE_COOKIE,
	NONCE_TTL_S,
	generateNonce,
	signToken,
} from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ cookies, url }) => {
	const nonce = generateNonce();
	const exp = Math.floor(Date.now() / 1000) + NONCE_TTL_S;
	const token = signToken({ nonce, exp });
	cookies.set(NONCE_COOKIE, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: url.protocol === "https:",
		maxAge: NONCE_TTL_S,
	});
	return json({ nonce });
};
