import { describe, it, expect, vi } from 'vitest';
import { getProjectById } from '@/lib/queries/projects';

describe('getProjectById', () => {
	it('returns the project row when the runner finds a match', async () => {
		const row = {
			id: 'beggy',
			name: 'Beggy',
			summary: '...',
			startedAt: '2025-01',
		};
		const runner = vi.fn().mockResolvedValue([row]);

		expect(await getProjectById('beggy', runner)).toEqual(row);
	});

	it('returns null when the runner finds no match', async () => {
		const runner = vi.fn().mockResolvedValue([]);

		expect(await getProjectById('does-not-exist', runner)).toBeNull();
	});

	it('passes projectId as a query parameter, never interpolated into the Cypher string', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getProjectById('beggy', runner);

		const [cypher, params] = runner.mock.calls[0];
		expect(cypher).not.toContain('beggy');
		expect(params).toEqual({ projectId: 'beggy' });
	});
});
