import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', async () => {
	const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
	return { ...actual, runQuery: vi.fn() };
});

import { runQuery, DbUnavailableError } from '@/lib/db';
import { GET } from './route';

describe('GET /api/projects', () => {
	beforeEach(() => {
		vi.mocked(runQuery).mockReset();
	});

	it('returns 200 with the ordered project rows in the success envelope', async () => {
		const rows = [
			{
				id: 'beggy',
				name: 'Beggy',
				summary: '...',
				startedAt: '2025-01',
			},
			{
				id: 'ur-air',
				name: 'UR-AIR',
				summary: '...',
				startedAt: '2025-10',
			},
		];
		vi.mocked(runQuery).mockResolvedValue(rows);

		const res = await GET();

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: rows });
	});

	it('orders the query by startedAt ascending', async () => {
		vi.mocked(runQuery).mockResolvedValue([]);
		await GET();

		const [cypher] = vi.mocked(runQuery).mock.calls[0];
		expect(cypher).toContain('ORDER BY p.startedAt');
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(runQuery).mockRejectedValue(
			new DbUnavailableError('CognoDB query failed.')
		);

		const res = await GET();

		expect(res.status).toBe(503);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});
});
