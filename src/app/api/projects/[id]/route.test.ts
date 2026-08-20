import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/projects', () => ({
	getProjectById: vi.fn(),
}));

import { getProjectById } from '@/lib/queries/projects';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

function paramsFor(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe('GET /api/projects/[id]', () => {
	beforeEach(() => {
		vi.mocked(getProjectById).mockReset();
	});

	it('returns 200 with the project when found', async () => {
		const project = {
			id: 'beggy',
			name: 'Beggy',
			summary: '...',
			startedAt: '2025-01',
		};
		vi.mocked(getProjectById).mockResolvedValue(project);

		const res = await GET(new Request('http://x'), paramsFor('beggy'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, data: project });
	});

	it('returns 404 NOT_FOUND when the project does not exist', async () => {
		vi.mocked(getProjectById).mockResolvedValue(null);

		const res = await GET(
			new Request('http://x'),
			paramsFor('does-not-exist')
		);

		expect(res.status).toBe(404);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('NOT_FOUND');
	});

	it('returns 400 VALIDATION_ERROR when id is empty', async () => {
		const res = await GET(new Request('http://x'), paramsFor(''));

		expect(res.status).toBe(400);
		expect(getProjectById).not.toHaveBeenCalled();
	});

	it('returns 503 DB_UNAVAILABLE when the query fails', async () => {
		vi.mocked(getProjectById).mockRejectedValue(
			new DbUnavailableError('down')
		);

		const res = await GET(new Request('http://x'), paramsFor('beggy'));

		expect(res.status).toBe(503);
	});
});
