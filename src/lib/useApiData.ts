/**
 * @module lib/use-api-data
 * A small client-side hook wrapping `apiGet` with loading/error/data
 * state, so every page follows the same fetch-render pattern instead of
 * re-deriving `useState` + `useEffect` boilerplate per view.
 *
 * @remarks
 * The effect below never calls `setState` synchronously in its body —
 * only inside the `.then`/`.catch` callbacks of the fetch promise. This
 * satisfies `react-hooks/set-state-in-effect`: "loading" is derived by
 * comparing the request currently in flight (`requestKey`) against the
 * key of the last request that actually resolved (`state.key`), rather
 * than being reset with an eager `setState` at the top of the effect.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiClientError } from './api-client';

type UseApiDataResult<T> = {
	data: T | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
};

type FetchState<T> =
	| { key: number; status: 'success'; data: T }
	| { key: number; status: 'error'; message: string }
	| { key: -1; status: 'idle' };

/**
 * Fetches `path` on mount and exposes `{ data, loading, error, refetch }`.
 *
 * @param path - The API path to GET.
 * @returns The current fetch state and a `refetch` function for retry buttons.
 */
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
				const message =
					err instanceof ApiClientError
						? err.message
						: 'Something went wrong loading this data.';
				setState({ key: requestKey, status: 'error', message });
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
		refetch,
	};
}
