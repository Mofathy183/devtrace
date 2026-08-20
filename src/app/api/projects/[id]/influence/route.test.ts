import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/influence', () => ({
	getProjectInfluence: vi.fn(),
}));

import { getProjectInfluence } from '@/lib/queries/influence';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

function paramsFor(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe('GET /api/projects/[id]/influence', () => {
	beforeEach(() => {
		vi.mocked(getProjectInfluence).mockReset();
	});

	it('returns 200 with the influence rows for a valid project id', async () => {
		const rows = [
			{
				lessonTitle: 'Concurrent writes need guards',
				fromProject: 'Beggy',
				technology: 'FastAPI',
			},
		];
		vi.mocked(getProjectInfluence).mockResolvedValue(rows);

		const res = await GET(
			new Request('http://x/api/projects/pyledger/influence'),
			paramsFor('pyledger')
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: rows });
		expect(getProjectInfluence).toHaveBeenCalledWith('pyledger');
	});

	it('returns 200 with an empty array when a project has no recorded influence', async () => {
		vi.mocked(getProjectInfluence).mockResolvedValue([]);

		const res = await GET(new Request('http://x'), paramsFor('beggy'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: [] });
	});

	it('returns 400 VALIDATION_ERROR when id is empty', async () => {
		const res = await GET(new Request('http://x'), paramsFor(''));

		expect(res.status).toBe(400);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('VALIDATION_ERROR');
		expect(getProjectInfluence).not.toHaveBeenCalled();
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(getProjectInfluence).mockRejectedValue(
			new DbUnavailableError('CognoDB query failed.')
		);

		const res = await GET(new Request('http://x'), paramsFor('pyledger'));

		expect(res.status).toBe(503);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});
});
