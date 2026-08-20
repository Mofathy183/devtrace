/**
 * @module lib/api-client
 * Thin client-side fetch wrapper that unwraps the `{ ok, data | error }`
 * envelope every API route returns, so components never touch `fetch`
 * or the envelope shape directly.
 */
import type { ApiFailure, ApiSuccess } from './errors';

/** Thrown by {@link apiGet} when the API returns a failure envelope. */
export class ApiClientError extends Error {
	constructor(
		public readonly code: string,
		message: string
	) {
		super(message);
		this.name = 'ApiClientError';
	}
}

/**
 * Fetches `path` and unwraps the success envelope's `data`, or throws
 * {@link ApiClientError} if the API returned a failure envelope or the
 * request itself failed (network error, non-JSON response).
 *
 * @param path - The API path to GET, e.g. `"/api/projects"`.
 * @returns The unwrapped `data` payload, typed as `T`.
 * @throws {ApiClientError} If the response envelope has `ok: false`, or the request/parsing fails.
 */
export async function apiGet<T>(path: string): Promise<T> {
	let res: Response;
	try {
		res = await fetch(path);
	} catch {
		throw new ApiClientError(
			'NETWORK_ERROR',
			'Could not reach the server.'
		);
	}

	const body = (await res.json().catch(() => null)) as
		ApiSuccess<T> | ApiFailure | null;

	if (!body) {
		throw new ApiClientError(
			'INTERNAL_ERROR',
			'Received an invalid response.'
		);
	}
	if (!body.ok) {
		throw new ApiClientError(body.error.code, body.error.message);
	}
	return body.data;
}
