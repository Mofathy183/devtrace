import { describe, it, expect } from 'vitest';
import { ZodError, z } from 'zod';
import { success, failure, handleRouteError } from '@/lib/errors';
import { DbConfigError, DbUnavailableError } from '@/lib/db';

async function bodyOf(res: Response) {
	return (await res.json()) as unknown;
}

describe('success', () => {
	it('wraps data in the { ok: true, data } envelope with a 200 default', async () => {
		const res = success({ id: 'beggy' });
		expect(res.status).toBe(200);
		expect(await bodyOf(res)).toEqual({ ok: true, data: { id: 'beggy' } });
	});

	it('uses the given status code when provided', async () => {
		const res = success({ id: 'beggy' }, 201);
		expect(res.status).toBe(201);
	});
});

describe('failure', () => {
	it('wraps code/message in the { ok: false, error } envelope with the given status', async () => {
		const res = failure('NOT_FOUND', 'Project not found', 404);
		expect(res.status).toBe(404);
		expect(await bodyOf(res)).toEqual({
			ok: false,
			error: { code: 'NOT_FOUND', message: 'Project not found' },
		});
	});
});

describe('handleRouteError', () => {
	it('maps ZodError to a 400 VALIDATION_ERROR with joined issue messages', async () => {
		const schema = z.object({ id: z.string().min(1) });
		const parseResult = schema.safeParse({ id: '' });
		expect(parseResult.success).toBe(false);

		const res = handleRouteError(parseResult.error as ZodError);
		expect(res.status).toBe(400);
		const body = (await bodyOf(res)) as { error: { code: string } };
		expect(body.error.code).toBe('VALIDATION_ERROR');
	});

	it('maps DbUnavailableError to a 503 DB_UNAVAILABLE', async () => {
		const res = handleRouteError(new DbUnavailableError('unreachable'));
		expect(res.status).toBe(503);
		const body = (await bodyOf(res)) as { error: { code: string } };
		expect(body.error.code).toBe('DB_UNAVAILABLE');
	});

	it('maps DbConfigError to a 500 DB_CONFIG_ERROR', async () => {
		const res = handleRouteError(new DbConfigError('missing env var'));
		expect(res.status).toBe(500);
		const body = (await bodyOf(res)) as { error: { code: string } };
		expect(body.error.code).toBe('DB_CONFIG_ERROR');
	});

	it('maps any unrecognized error to a 500 INTERNAL_ERROR without leaking its message', async () => {
		const res = handleRouteError(new Error('some raw internal detail'));
		expect(res.status).toBe(500);
		const body = (await bodyOf(res)) as {
			error: { code: string; message: string };
		};
		expect(body.error.code).toBe('INTERNAL_ERROR');
		expect(body.error.message).not.toContain('raw internal detail');
	});

	it('maps a non-Error thrown value to a 500 INTERNAL_ERROR', async () => {
		const res = handleRouteError('just a string throw');
		expect(res.status).toBe(500);
		const body = (await bodyOf(res)) as { error: { code: string } };
		expect(body.error.code).toBe('INTERNAL_ERROR');
	});
});
