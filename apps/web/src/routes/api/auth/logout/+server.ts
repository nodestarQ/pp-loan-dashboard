import { json } from "@sveltejs/kit";

import { SESSION_COOKIE } from "$lib/server/auth";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete(SESSION_COOKIE, { path: "/" });
	return json({ ok: true });
};
