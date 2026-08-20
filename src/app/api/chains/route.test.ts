import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/influence', () => ({
	getInfluenceChains: vi.fn(),
}));

import { getInfluenceChains } from '@/lib/queries/influence';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

describe('GET /api/chains', () => {
	beforeEach(() => {
		vi.mocked(getInfluenceChains).mockReset();
	});

	it('returns 200 with the chain rows in the success envelope', async () => {
		const rows = [{ path: 'fake-path-1' }, { path: 'fake-path-2' }];
		vi.mocked(getInfluenceChains).mockResolvedValue(rows);

		const res = await GET();

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: rows });
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(getInfluenceChains).mockRejectedValue(
			new DbUnavailableError('CognoDB query failed.')
		);

		const res = await GET();

		expect(res.status).toBe(503);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});
});
