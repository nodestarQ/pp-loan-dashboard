import crypto from "node:crypto";

import { env } from "$env/dynamic/private";

import { signToken, verifyToken } from "./auth";

export const ACCESS_COOKIE = "huddle_access";
export const ACCESS_TTL_S = 30 * 24 * 60 * 60;

// "Soft launch" mode is implicit: set EARLY_ACCESS_PASSWORD in env and the
// whole site is gated behind /unlock. Unset it to disable the gate; the
// SIWE wallet whitelist then takes over for the leaderboards. This avoids
// a separate boolean flag that could disagree with the password value.
export function isSoftLaunchActive(): boolean {
	return Boolean(env.EARLY_ACCESS_PASSWORD);
}

export function verifyPassword(input: string): boolean {
	const expected = env.EARLY_ACCESS_PASSWORD;
	if (!expected) return false;
	const a = Buffer.from(input);
	const b = Buffer.from(expected);
	// Length-leak is acceptable for a shared soft-launch secret. Bail before
	// timingSafeEqual since it requires equal-length buffers.
	if (a.length !== b.length) return false;
	return crypto.timingSafeEqual(a, b);
}

export function issueAccessCookie(): string {
	const exp = Math.floor(Date.now() / 1000) + ACCESS_TTL_S;
	return signToken({ ok: true, exp });
}

export function hasValidAccess(cookieValue: string | undefined): boolean {
	return verifyToken<{ ok: true }>(cookieValue) !== null;
}
