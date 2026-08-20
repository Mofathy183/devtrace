import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet, ApiClientError } from '@/lib/api-client';

function mockFetchResolving(body: unknown, ok = true) {
	return vi.spyOn(global, 'fetch').mockResolvedValue({
		ok,
		json: () => Promise.resolve(body),
	} as Response);
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('apiGet', () => {
	it('returns the unwrapped data on a success envelope', async () => {
		mockFetchResolving({ ok: true, data: { id: 'beggy' } });

		const result = await apiGet<{ id: string }>('/api/projects/beggy');

		expect(result).toEqual({ id: 'beggy' });
	});

	it('throws ApiClientError with the code/message from a failure envelope', async () => {
		mockFetchResolving({
			ok: false,
			error: {
				code: 'DB_UNAVAILABLE',
				message: 'CognoDB is unreachable.',
			},
		});

		await expect(apiGet('/api/projects')).rejects.toMatchObject({
			code: 'DB_UNAVAILABLE',
			message: 'CognoDB is unreachable.',
		});
	});

	it('throws ApiClientError when fetch itself rejects (network error)', async () => {
		vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));

		await expect(apiGet('/api/projects')).rejects.toBeInstanceOf(
			ApiClientError
		);
	});

	it("throws ApiClientError when the response body isn't valid JSON", async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: () => Promise.reject(new Error('bad json')),
		} as unknown as Response);

		await expect(apiGet('/api/projects')).rejects.toMatchObject({
			code: 'INTERNAL_ERROR',
		});
	});
});
