/**
 * @module lib/db
 * Single process-wide Neo4j driver singleton for talking to CognoDB, plus
 * the one function (`runQuery`) every query in this app goes through. Owns
 * connection pooling, session lifecycle, and translating any driver-level
 * failure into the app's typed error types so callers never see a raw
 * neo4j-driver exception.
 *
 * @remarks
 * The driver is cached on `globalThis` rather than a module-level variable
 * because Next.js dev-mode hot-reload re-evaluates this module on every
 * file save; without the cache each reload opens a new connection pool
 * against CognoDB's free-tier connection cap.
 */
import neo4j, { Driver, Session } from 'neo4j-driver';

/**
 * Thrown when required CognoDB connection env vars
 * (`COGNODB_URI` / `COGNODB_USERNAME` / `COGNODB_PASSWORD`) are missing.
 * Distinct from {@link DbUnavailableError} because this is a deploy/config
 * mistake, not a transient network condition — it should never be retried.
 */
export class DbConfigError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DbConfigError';
	}
}

/**
 * Thrown when a query or connectivity check to CognoDB fails for any
 * reason after configuration was valid — network error, auth rejection,
 * instance sleeping/unreachable, timeout. Callers (API routes) catch this
 * to return a 503 with a typed envelope instead of leaking a driver stack
 * trace to the client.
 */
export class DbUnavailableError extends Error {
	/**
	 * @param message - Human-readable summary safe to surface to a caller.
	 * @param cause - The original driver-level error, kept for server-side logging only.
	 */
	constructor(
		message: string,
		public readonly cause?: unknown
	) {
		super(message);
		this.name = 'DbUnavailableError';
	}
}

/**
 * Reads a required environment variable.
 *
 * @param name - The env var name to read.
 * @returns The env var's value.
 * @throws {DbConfigError} If the env var is unset or empty.
 */
function getRequiredEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new DbConfigError(`Missing required env var: ${name}`);
	}
	return value;
}

/** Shape used to stash the singleton driver across hot-reloads. */
type DriverGlobal = { __neo4jDriver?: Driver };

/**
 * Lazily creates (and reuses) the single Neo4j driver instance for this
 * process. Safe to call repeatedly — only the first call in a process
 * actually constructs a driver.
 *
 * @remarks Not exported. Tests should not call this directly; inject a
 * fake session via {@link runQuery}'s `sessionFactory` parameter instead,
 * so unit tests never open a real network connection.
 * @returns The shared {@link Driver} instance.
 * @throws {DbConfigError} If connection env vars are missing.
 */
function getDriver(): Driver {
	const g = globalThis as unknown as DriverGlobal;
	if (g.__neo4jDriver) return g.__neo4jDriver;

	const uri = getRequiredEnv('COGNODB_URI');
	const username = getRequiredEnv('COGNODB_USERNAME');
	const password = getRequiredEnv('COGNODB_PASSWORD');

	const newDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
		maxConnectionPoolSize: 20,
		connectionAcquisitionTimeout: 10_000,
	});

	g.__neo4jDriver = newDriver;
	return newDriver;
}

/**
 * Runs a single parameterized Cypher query inside a managed session and
 * returns the result rows as plain objects.
 *
 * @remarks Never string-concatenate Cypher — always pass values via
 * `params` so CognoDB treats them as data, not query text.
 * @example
 * const rows = await runQuery<{ id: string }>(
 *   `MATCH (p:Project {id: $id}) RETURN p.id AS id`,
 *   { id: "beggy" }
 * );
 *
 * @param cypher - The parameterized Cypher query text.
 * @param params - Parameter values referenced by `$name` in `cypher`.
 * @param sessionFactory - Optional override for creating the driver
 *   session; used by unit tests to inject a fake session without a real
 *   driver. Defaults to `getDriver().session()`.
 * @returns The query's result rows, each mapped from a Neo4j record to a plain object.
 * @throws {DbUnavailableError} If the query fails for any reason (network, auth, timeout, bad Cypher).
 */
export async function runQuery<T = Record<string, unknown>>(
	cypher: string,
	params: Record<string, unknown> = {},
	sessionFactory: () => Session = () => getDriver().session()
): Promise<T[]> {
	let session: Session | null = null;
	try {
		session = sessionFactory();
		const result = await session.run(cypher, params);
		return result.records.map((record) => record.toObject() as T);
	} catch (err) {
		throw new DbUnavailableError(
			'CognoDB query failed — the database may be unreachable.',
			err
		);
	} finally {
		if (session) await session.close();
	}
}

/**
 * Verifies the driver can actually reach CognoDB. Intended for a health
 * check route so connectivity problems fail fast and visibly rather than
 * surfacing as a confusing error on the first real query.
 *
 * @throws {DbUnavailableError} If connectivity verification fails.
 */
export async function verifyConnection(): Promise<void> {
	try {
		await getDriver().verifyConnectivity();
	} catch (err) {
		throw new DbUnavailableError('Could not connect to CognoDB.', err);
	}
}

/**
 * Closes the shared driver and clears the cached instance. Intended for
 * graceful shutdown in long-running processes (e.g. the seed script);
 * API routes running in serverless functions generally don't need to
 * call this.
 */
export async function closeDriver(): Promise<void> {
	const g = globalThis as unknown as DriverGlobal;
	if (g.__neo4jDriver) {
		await g.__neo4jDriver.close();
		g.__neo4jDriver = undefined;
	}
}
