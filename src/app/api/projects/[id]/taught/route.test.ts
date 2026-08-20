import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/influence', () => ({
	getProjectTaughtLessons: vi.fn(),
}));

import { getProjectTaughtLessons } from '@/lib/queries/influence';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

function paramsFor(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe('GET /api/projects/[id]/taught', () => {
	beforeEach(() => {
		vi.mocked(getProjectTaughtLessons).mockReset();
	});

	it('returns 200 with the taught rows for a valid project id', async () => {
		const rows = [
			{
				lessonTitle: 'Concurrent writes need guards',
				toProject: 'PyLedger',
			},
		];
		vi.mocked(getProjectTaughtLessons).mockResolvedValue(rows);

		const res = await GET(new Request('http://x'), paramsFor('beggy'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: rows });
		expect(getProjectTaughtLessons).toHaveBeenCalledWith('beggy');
	});

	it('returns 200 with an empty array when a project taught nothing', async () => {
		vi.mocked(getProjectTaughtLessons).mockResolvedValue([]);

		const res = await GET(new Request('http://x'), paramsFor('ur-air'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: [] });
	});

	it('returns 400 VALIDATION_ERROR when id is empty', async () => {
		const res = await GET(new Request('http://x'), paramsFor(''));
		expect(res.status).toBe(400);
		expect(getProjectTaughtLessons).not.toHaveBeenCalled();
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(getProjectTaughtLessons).mockRejectedValue(
			new DbUnavailableError('CognoDB query failed.')
		);

		const res = await GET(new Request('http://x'), paramsFor('beggy'));
		expect(res.status).toBe(503);
	});
});
