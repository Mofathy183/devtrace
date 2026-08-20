import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/queries/influence', () => ({
	getInfluenceChains: vi.fn(),
}));

import { getInfluenceChains } from '@/lib/queries/influence';
import { GET } from './route';
import { DbUnavailableError } from '@/lib/db';

function fakeNode(elementId: string, label: string, name: string) {
	return { elementId, labels: [label], properties: { name } };
}

function fakePath(
	nodes: { elementId: string; label: string; name: string }[],
	relTypes: string[]
) {
	const built = nodes.map((n) => fakeNode(n.elementId, n.label, n.name));
	const segments = relTypes.map((type, i) => ({
		start: built[i],
		end: built[i + 1],
		relationship: { type },
	}));
	return { start: built[0], end: built[built.length - 1], segments };
}

describe('GET /api/chains', () => {
	beforeEach(() => {
		vi.mocked(getInfluenceChains).mockReset();
	});

	it('returns 200 with serialized chain data in the success envelope', async () => {
		const path = fakePath(
			[
				{ elementId: 'p1', label: 'Project', name: 'Beggy' },
				{ elementId: 'l1', label: 'Lesson', name: 'Fakes over mocks' },
				{ elementId: 'p2', label: 'Project', name: 'PyLedger' },
			],
			['TAUGHT_LESSON', 'INFORMED']
		);
		vi.mocked(getInfluenceChains).mockResolvedValue([{ path } as never]);

		const res = await GET();
		const body = (await res.json()) as {
			ok: true;
			data: { nodes: unknown[]; steps: unknown[] }[];
		};

		expect(res.status).toBe(200);
		expect(body.data).toHaveLength(1);
		expect(body.data[0].nodes).toHaveLength(3);
		expect(body.data[0].steps).toEqual([
			{ type: 'TAUGHT_LESSON', from: 'p1', to: 'l1' },
			{ type: 'INFORMED', from: 'l1', to: 'p2' },
		]);
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
