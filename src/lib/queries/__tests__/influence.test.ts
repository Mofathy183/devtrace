import { describe, it, expect, vi } from 'vitest';
import {
	getProjectInfluence,
	getInfluenceChains,
} from '@/lib/queries/influence';

describe('getProjectInfluence', () => {
	it("queries by the given projectId and returns the runner's rows unchanged", async () => {
		const fakeRows = [
			{
				lessonTitle: 'Concurrent writes need guards',
				fromProject: 'Beggy',
				technology: 'FastAPI',
			},
		];
		const runner = vi.fn().mockResolvedValue(fakeRows);

		const result = await getProjectInfluence('pyledger', runner);

		expect(result).toEqual(fakeRows);
	});

	it('passes projectId as a query parameter, never interpolated into the Cypher string', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getProjectInfluence('pyledger', runner);

		const [cypher, params] = runner.mock.calls[0];
		expect(cypher).not.toContain('pyledger');
		expect(params).toEqual({ projectId: 'pyledger' });
	});

	it('traverses earlier project -> Lesson -> target project -> Technology', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getProjectInfluence('pyledger', runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('TAUGHT_LESSON');
		expect(cypher).toContain('INFORMED');
		expect(cypher).toContain('USES');
	});
});

describe('getInfluenceChains', () => {
	it("returns the runner's rows unchanged", async () => {
		const fakePaths = [{ path: 'fake-path-object' }];
		const runner = vi.fn().mockResolvedValue(fakePaths);

		const result = await getInfluenceChains(5, runner);

		expect(result).toEqual(fakePaths);
	});

	it('doubles maxDepth into the edge-count bound, since each project hop is two edges', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getInfluenceChains(3, runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('*1..6');
	});

	it('defaults maxDepth to 5 project hops (bound of 10 edges) when omitted', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getInfluenceChains(undefined, runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('*1..10');
	});

	it('excludes zero-length paths by requiring start and end to differ', async () => {
		const runner = vi.fn().mockResolvedValue([]);
		await getInfluenceChains(5, runner);

		const [cypher] = runner.mock.calls[0];
		expect(cypher).toContain('start <> end');
	});
});
