import { json } from "@sveltejs/kit";

import {
	NONCE_COOKIE,
	SESSION_COOKIE,
	SESSION_TTL_S,
	isWhitelisted,
	parseSiwe,
	signToken,
	verifySiweSignature,
	verifyToken,
} from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies, request, url }) => {
	const body = (await request.json().catch(() => null)) as
		| { message?: unknown; signature?: unknown }
		| null;
	if (
		!body ||
		typeof body.message !== "string" ||
		typeof body.signature !== "string"
	) {
		return json({ ok: false, reason: "bad_request" }, { status: 400 });
	}

	const nonceTok = verifyToken<{ nonce: string }>(cookies.get(NONCE_COOKIE));
	if (!nonceTok) {
		return json({ ok: false, reason: "nonce_expired" }, { status: 401 });
	}

	const parsed = parseSiwe(body.message);
	if (!parsed) {
		return json({ ok: false, reason: "bad_message" }, { status: 400 });
	}

	if (parsed.domain !== url.host) {
		return json({ ok: false, reason: "domain_mismatch" }, { status: 400 });
	}
	if (parsed.nonce !== nonceTok.nonce) {
		return json({ ok: false, reason: "nonce_mismatch" }, { status: 400 });
	}

	const sigOk = await verifySiweSignature(
		body.message,
		body.signature as `0x${string}`,
		parsed.address,
	);
	if (!sigOk) {
		return json({ ok: false, reason: "bad_signature" }, { status: 401 });
	}

	cookies.delete(NONCE_COOKIE, { path: "/" });

	const address = parsed.address.toLowerCase();
	if (!isWhitelisted(address)) {
		return json(
			{ ok: false, reason: "not_whitelisted", address },
			{ status: 403 },
		);
	}

	const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_S;
	cookies.set(SESSION_COOKIE, signToken({ address, exp }), {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		secure: url.protocol === "https:",
		maxAge: SESSION_TTL_S,
	});

	return json({ ok: true, address });
};
