import crypto from "node:crypto";
import { recoverMessageAddress } from "viem";

import { env } from "$env/dynamic/private";

export const SESSION_COOKIE = "huddle_session";
export const NONCE_COOKIE = "huddle_nonce";

export const SESSION_TTL_S = 7 * 24 * 60 * 60;
export const NONCE_TTL_S = 5 * 60;

function getSecret(): string {
	const s = env.AUTH_SECRET;
	if (!s || s.length < 32) {
		throw new Error(
			"AUTH_SECRET is unset or too short (need >= 32 chars). Generate with: openssl rand -hex 32",
		);
	}
	return s;
}

function b64url(s: string | Buffer): string {
	return Buffer.from(s).toString("base64url");
}

function fromB64url(s: string): Buffer {
	return Buffer.from(s, "base64url");
}

function hmac(payload: string): string {
	return crypto
		.createHmac("sha256", getSecret())
		.update(payload)
		.digest("base64url");
}

export function signToken(payload: object): string {
	const data = b64url(JSON.stringify(payload));
	return `${data}.${hmac(data)}`;
}

export function verifyToken<T extends object>(
	token: string | undefined,
): T | null {
	if (!token) return null;
	const dot = token.indexOf(".");
	if (dot <= 0) return null;
	const data = token.slice(0, dot);
	const sig = token.slice(dot + 1);
	const expected = hmac(data);
	const a = Buffer.from(sig);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
	let obj: T & { exp?: number };
	try {
		obj = JSON.parse(fromB64url(data).toString("utf8")) as T & {
			exp?: number;
		};
	} catch {
		return null;
	}
	if (obj.exp && obj.exp < Math.floor(Date.now() / 1000)) return null;
	return obj;
}

export function generateNonce(): string {
	return crypto.randomBytes(16).toString("hex");
}

export function getWhitelist(): Set<string> {
	const raw = env.WALLET_WHITELIST ?? "";
	return new Set(
		raw
			.split(",")
			.map((s) => s.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function isWhitelisted(address: string): boolean {
	return getWhitelist().has(address.toLowerCase());
}

export interface ParsedSiwe {
	address: string;
	nonce: string;
	domain: string;
}

// EIP-4361 strict-enough parser. We only need the domain, address, and nonce
// for verification; the rest of the message is signed verbatim by the wallet
// so anything extra is captured by the signature check.
export function parseSiwe(message: string): ParsedSiwe | null {
	const lines = message.split("\n");
	if (lines.length < 8) return null;
	const m1 = /^(\S+) wants you to sign in with your Ethereum account:$/.exec(
		lines[0],
	);
	if (!m1) return null;
	const domain = m1[1];
	const address = lines[1];
	if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return null;
	const nonceLine = lines.find((l) => l.startsWith("Nonce: "));
	if (!nonceLine) return null;
	const nonce = nonceLine.slice("Nonce: ".length).trim();
	if (!/^[a-zA-Z0-9]+$/.test(nonce)) return null;
	return { address, nonce, domain };
}

export async function verifySiweSignature(
	message: string,
	signature: `0x${string}`,
	expectedAddress: string,
): Promise<boolean> {
	try {
		const recovered = await recoverMessageAddress({ message, signature });
		return recovered.toLowerCase() === expectedAddress.toLowerCase();
	} catch {
		return false;
	}
}

export interface SessionPayload {
	address: string;
	exp: number;
}

export function readSession(
	cookieValue: string | undefined,
): SessionPayload | null {
	const tok = verifyToken<SessionPayload>(cookieValue);
	if (!tok) return null;
	if (!isWhitelisted(tok.address)) return null;
	return tok;
}
