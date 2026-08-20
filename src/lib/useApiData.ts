/**
 * @module lib/use-api-data
 * A small client-side hook wrapping `apiGet` with loading/error/data
 * state. Exposes both a human-readable `error` message and the raw
 * `errorCode` (e.g. `NOT_FOUND`) so callers can branch on failure type
 * without parsing the message.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiClientError } from './api-client';

type UseApiDataResult<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
	errorCode: string | null;
	refetch: () => void;
};

type FetchState<T> =
	| { key: number; status: 'success'; data: T }
	| { key: number; status: 'error'; message: string; code: string }
	| { key: -1; status: 'idle' };

export function useApiData<T>(path: string): UseApiDataResult<T> {
	const [attempt, setAttempt] = useState(0);
	const [state, setState] = useState<FetchState<T>>({
		key: -1,
		status: 'idle',
	});

	const refetch = useCallback(() => setAttempt((n) => n + 1), []);

	useEffect(() => {
		let cancelled = false;
		const requestKey = attempt;

		apiGet<T>(path)
			.then((result) => {
				if (!cancelled) {
					setState({
						key: requestKey,
						status: 'success',
						data: result,
					});
				}
			})
			.catch((err: unknown) => {
				if (cancelled) return;
				const code =
					err instanceof ApiClientError ? err.code : 'UNKNOWN';
				const message =
					err instanceof ApiClientError
						? err.message
						: 'Something went wrong loading this data.';
				setState({ key: requestKey, status: 'error', message, code });
			});

		return () => {
			cancelled = true;
		};
	}, [path, attempt]);

	const loading = state.key !== attempt;

	return {
		data: !loading && state.status === 'success' ? state.data : null,
		loading,
		error: !loading && state.status === 'error' ? state.message : null,
		errorCode: !loading && state.status === 'error' ? state.code : null,
		refetch,
	};
}
