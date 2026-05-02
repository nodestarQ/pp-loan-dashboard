type Address = `0x${string}`;

interface Eip1193Provider {
	request: <T = unknown>(args: {
		method: string;
		params?: unknown[];
	}) => Promise<T>;
}

export type AuthErrorReason =
	| "no_wallet"
	| "user_rejected"
	| "no_account"
	| "nonce_expired"
	| "bad_signature"
	| "not_whitelisted"
	| "verify_failed"
	| "unknown";

export class AuthError extends Error {
	reason: AuthErrorReason;
	address?: string;
	constructor(message: string, reason: AuthErrorReason, address?: string) {
		super(message);
		this.reason = reason;
		this.address = address;
	}
}

// Discover an EIP-1193 provider via EIP-6963 (modern wallet announcement
// protocol), falling back to the legacy `window.ethereum` injection. We
// resolve as soon as either path yields a provider, or null after a
// timeout so the caller can surface a "no wallet" error.
async function discoverProvider(
	timeoutMs = 1500,
): Promise<Eip1193Provider | null> {
	if (typeof window === "undefined") return null;
	const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
	if (eth) return eth;

	return new Promise((resolve) => {
		let done = false;
		const finish = (provider: Eip1193Provider | null) => {
			if (done) return;
			done = true;
			window.removeEventListener(
				"eip6963:announceProvider",
				onAnnounce as EventListener,
			);
			resolve(provider);
		};
		const onAnnounce = (event: Event) => {
			const detail = (event as CustomEvent).detail as
				| { provider?: Eip1193Provider }
				| undefined;
			if (detail?.provider) finish(detail.provider);
		};
		window.addEventListener(
			"eip6963:announceProvider",
			onAnnounce as EventListener,
		);
		window.dispatchEvent(new Event("eip6963:requestProvider"));

		const start = Date.now();
		const poll = () => {
			if (done) return;
			const w = (window as unknown as { ethereum?: Eip1193Provider })
				.ethereum;
			if (w) {
				finish(w);
				return;
			}
			if (Date.now() - start >= timeoutMs) {
				finish(null);
				return;
			}
			setTimeout(poll, 100);
		};
		setTimeout(poll, 100);
	});
}

async function fetchNonce(): Promise<string> {
	const r = await fetch("/api/auth/nonce", { credentials: "same-origin" });
	if (!r.ok) throw new AuthError("Failed to start sign-in", "verify_failed");
	const { nonce } = (await r.json()) as { nonce: string };
	return nonce;
}

function buildSiweMessage(opts: {
	domain: string;
	address: Address;
	uri: string;
	chainId: number;
	nonce: string;
	issuedAt: string;
}): string {
	return [
		`${opts.domain} wants you to sign in with your Ethereum account:`,
		opts.address,
		"",
		"Sign in to Huddle Health to view holder & borrower data.",
		"",
		`URI: ${opts.uri}`,
		"Version: 1",
		`Chain ID: ${opts.chainId}`,
		`Nonce: ${opts.nonce}`,
		`Issued At: ${opts.issuedAt}`,
	].join("\n");
}

export async function connectAndSignIn(): Promise<{ address: Address }> {
	const eth = await discoverProvider();
	if (!eth) {
		throw new AuthError(
			"No browser wallet detected. Install MetaMask, Rabby, or another Ethereum wallet.",
			"no_wallet",
		);
	}

	let address: Address;
	try {
		const accounts = await withTimeout(
			eth.request<string[]>({ method: "eth_requestAccounts" }),
			30_000,
			"Wallet didn't respond. Open the extension and approve the connection.",
		);
		if (!accounts.length) {
			throw new AuthError("No account returned by wallet", "no_account");
		}
		address = accounts[0] as Address;
	} catch (e) {
		if (e instanceof AuthError) throw e;
		throw new AuthError("Wallet connection rejected.", "user_rejected");
	}

	const nonce = await fetchNonce();
	const message = buildSiweMessage({
		domain: window.location.host,
		address,
		uri: window.location.origin,
		chainId: 1,
		nonce,
		issuedAt: new Date().toISOString(),
	});

	let signature: `0x${string}`;
	try {
		signature = await withTimeout(
			eth.request<`0x${string}`>({
				method: "personal_sign",
				params: [message, address],
			}),
			120_000,
			"Signature request timed out. Open the wallet extension and approve the message.",
		);
	} catch (e) {
		if (e instanceof AuthError) throw e;
		throw new AuthError("Signature request rejected.", "user_rejected");
	}

	const res = await fetch("/api/auth/verify", {
		method: "POST",
		headers: { "content-type": "application/json" },
		credentials: "same-origin",
		body: JSON.stringify({ message, signature }),
	});
	const payload = (await res.json().catch(() => ({}))) as {
		ok?: boolean;
		reason?: AuthErrorReason;
		address?: string;
	};
	if (res.status === 403 && payload.reason === "not_whitelisted") {
		throw new AuthError(
			"This wallet is not authorized to view this content.",
			"not_whitelisted",
			payload.address,
		);
	}
	if (!res.ok || !payload.ok) {
		throw new AuthError(
			"Sign-in failed. Please try again.",
			payload.reason ?? "verify_failed",
		);
	}
	return { address };
}

export async function logout(): Promise<void> {
	await fetch("/api/auth/logout", {
		method: "POST",
		credentials: "same-origin",
	});
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
	return Promise.race([
		p,
		new Promise<T>((_, reject) =>
			setTimeout(
				() => reject(new AuthError(label, "verify_failed")),
				ms,
			),
		),
	]);
}
