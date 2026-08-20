import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', async () => {
	const actual = await vi.importActual<typeof import('@/lib/db')>('@/lib/db');
	return { ...actual, verifyConnection: vi.fn() };
});

import { verifyConnection, DbUnavailableError } from '@/lib/db';
import { GET } from './route';

describe('GET /api/health', () => {
	beforeEach(() => {
		vi.mocked(verifyConnection).mockReset();
	});

	it('returns 200 with connected status when CognoDB is reachable', async () => {
		vi.mocked(verifyConnection).mockResolvedValue(undefined);

		const res = await GET();

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			ok: true,
			data: { status: 'connected' },
		});
	});

	it('returns 503 DB_UNAVAILABLE when CognoDB is unreachable', async () => {
		vi.mocked(verifyConnection).mockRejectedValue(
			new DbUnavailableError('Could not connect to CognoDB.')
		);

		const res = await GET();

		expect(res.status).toBe(503);
		const body = (await res.json()) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});
});
