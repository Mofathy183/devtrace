import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/categories', () => ({
	getCategoryById: vi.fn(),
	getCategoryDetail: vi.fn(),
}));

import { getCategoryById, getCategoryDetail } from '@/lib/queries/categories';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

function paramsFor(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe('GET /api/categories/[id]', () => {
	beforeEach(() => {
		vi.mocked(getCategoryById).mockReset();
		vi.mocked(getCategoryDetail).mockReset();
	});

	it('returns 200 with the category and its technologies when found', async () => {
		const category = { id: 'backend', name: 'Backend' };
		const technologies = [{ technology: 'Express.js', project: 'Beggy' }];
		vi.mocked(getCategoryById).mockResolvedValue(category);
		vi.mocked(getCategoryDetail).mockResolvedValue(technologies);

		const res = await GET(new Request('http://x'), paramsFor('backend'));

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			ok: true,
			data: { category, technologies },
		});
	});

	it('returns 404 NOT_FOUND when the category does not exist, without calling getCategoryDetail', async () => {
		vi.mocked(getCategoryById).mockResolvedValue(null);

		const res = await GET(
			new Request('http://x'),
			paramsFor('does-not-exist')
		);

		expect(res.status).toBe(404);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('NOT_FOUND');
		expect(getCategoryDetail).not.toHaveBeenCalled();
	});

	it('returns 400 VALIDATION_ERROR when id is empty', async () => {
		const res = await GET(new Request('http://x'), paramsFor(''));

		expect(res.status).toBe(400);
		expect(getCategoryById).not.toHaveBeenCalled();
	});

	it('returns 503 DB_UNAVAILABLE when getCategoryById fails', async () => {
		vi.mocked(getCategoryById).mockRejectedValue(
			new DbUnavailableError('down')
		);

		const res = await GET(new Request('http://x'), paramsFor('backend'));

		expect(res.status).toBe(503);
	});

	it('returns 503 DB_UNAVAILABLE when getCategoryDetail fails', async () => {
		vi.mocked(getCategoryById).mockResolvedValue({
			id: 'backend',
			name: 'Backend',
		});
		vi.mocked(getCategoryDetail).mockRejectedValue(
			new DbUnavailableError('down')
		);

		const res = await GET(new Request('http://x'), paramsFor('backend'));

		expect(res.status).toBe(503);
	});
});
