import { getSql } from "./client";

export type HolderRow = {
	address: string;
	balance: number;
};

export type LoanBorrowerRow = {
	borrower: string;
	locked: number;
};

/**
 * Number of distinct PPG token ids that currently sit inside any tracked
 * loan contract as collateral. Drives both the hero number and the meter
 * fill. DISTINCT because the same token id could in principle appear
 * across protocols (it shouldn't while a loan is active, but this keeps
 * the number honest against bad indexer states).
 */
export async function getActiveLoanCount(): Promise<number> {
	const sql = getSql();
	const rows = await sql<{ count: string }[]>`
		SELECT COUNT(DISTINCT token_id)::text AS count
		FROM loan
		WHERE status = 'active'
	`;
	return Number(rows[0]?.count ?? 0);
}

export async function getTopHolders(limit = 20): Promise<HolderRow[]> {
	const sql = getSql();
	// ORDER BY references holder.balance explicitly; without the qualifier
	// Postgres resolves `balance` to the text-cast output column and sorts
	// lexicographically, ranking "84" above "799".
	const rows = await sql<{ address: string; balance: string }[]>`
		SELECT address, balance::text AS balance
		FROM holder
		WHERE balance > 0
		ORDER BY holder.balance DESC, address ASC
		LIMIT ${limit}
	`;
	return rows.map((r) => ({ address: r.address, balance: Number(r.balance) }));
}

export async function getTopLoanAddresses(
	limit = 20,
): Promise<LoanBorrowerRow[]> {
	const sql = getSql();
	// Same alias-shadowing trap as getTopHolders: order by the raw COUNT(*)
	// expression so the sort is numeric, not lexicographic.
	const rows = await sql<{ borrower: string; locked: string }[]>`
		SELECT borrower, COUNT(*)::text AS locked
		FROM loan
		WHERE status = 'active'
		GROUP BY borrower
		ORDER BY COUNT(*) DESC, borrower ASC
		LIMIT ${limit}
	`;
	return rows.map((r) => ({
		borrower: r.borrower,
		locked: Number(r.locked),
	}));
}

/**
 * Wrap a query so a missing relation, connection error, missing env var,
 * or indexer-not-yet-migrated condition degrades to a safe fallback. The
 * page still renders; the sync banner (phase 12) tells the user why the
 * data is empty.
 */
export async function safeQuery<T>(
	run: () => Promise<T>,
	fallback: T,
	label: string,
): Promise<T> {
	try {
		return await run();
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.warn(`[db] ${label} failed: ${msg}`);
		return fallback;
	}
}
