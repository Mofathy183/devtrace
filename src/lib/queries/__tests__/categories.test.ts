import { describe, it, expect, vi } from 'vitest';
import {
	getCategories,
	getCategoryById,
	getCategoryDetail,
} from '@/lib/queries/categories';

describe('getCategories', () => {
	it("returns the runner's rows unchanged", async () => {
		const rows = [
			{ id: 'backend', name: 'Backend', technologyCount: 6 },
			{ id: 'frontend', name: 'Frontend', technologyCount: 3 },
		];
		const runner = vi.fn().mockResolvedValue(rows);

		expect(await getCategories(runner)).toEqual(rows);
	});

	it('left-joins Technology so a category with zero technologies still returns a row', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getCategories(runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('OPTIONAL MATCH');
	});

	it('orders by category name', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getCategories(runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('ORDER BY c.name');
	});
});

describe('getCategoryById', () => {
	it('returns the category row when the runner finds a match', async () => {
		const row = { id: 'backend', name: 'Backend' };
		const runner = vi.fn().mockResolvedValue([row]);

		expect(await getCategoryById('backend', runner)).toEqual(row);
	});

	it('returns null when the runner finds no match', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		expect(await getCategoryById('does-not-exist', runner)).toBeNull();
	});

	it('passes categoryId as a query parameter, never interpolated into the Cypher string', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getCategoryById('backend', runner);

		const [cypher, params] = runner.mock.calls[0];
		expect(cypher).not.toContain('backend');
		expect(params).toEqual({ categoryId: 'backend' });
	});
});

describe('getCategoryDetail', () => {
	it("returns the runner's rows unchanged", async () => {
		const rows = [{ technology: 'Express.js', project: 'Beggy' }];
		const runner = vi.fn().mockResolvedValue(rows);

		expect(await getCategoryDetail('backend', runner)).toEqual(rows);
	});

	it('traverses Category <- Technology <- Project (BELONGS_TO_CATEGORY then USES)', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getCategoryDetail('backend', runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('BELONGS_TO_CATEGORY');
		expect(cypher).toContain('USES');
	});

	it('passes categoryId as a query parameter, never interpolated into the Cypher string', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getCategoryDetail('backend', runner);

		const [cypher, params] = runner.mock.calls[0];
		expect(cypher).not.toContain('backend');
		expect(params).toEqual({ categoryId: 'backend' });
	});
});
