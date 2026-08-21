import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/categories', () => ({
	getCategories: vi.fn(),
}));

import { getCategories } from '@/lib/queries/categories';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

describe('GET /api/categories', () => {
	beforeEach(() => {
		vi.mocked(getCategories).mockReset();
	});

	it('returns 200 with category rows in the success envelope', async () => {
		const rows = [
			{ id: 'backend', name: 'Backend', technologyCount: 6 },
			{ id: 'frontend', name: 'Frontend', technologyCount: 3 },
		];
		vi.mocked(getCategories).mockResolvedValue(rows);

		const res = await GET();

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: rows });
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(getCategories).mockRejectedValue(
			new DbUnavailableError('CognoDB query failed.')
		);

		const res = await GET();

		expect(res.status).toBe(503);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});
});
