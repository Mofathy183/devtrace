/**
 * @module app/api/projects/[id]/taught/route
 * Serves the outgoing mirror of the influence query: lessons taught by
 * the given project that informed a later one.
 */
import { z } from 'zod';
import { getProjectTaughtLessons } from '@/lib/queries/influence';
import { success, handleRouteError } from '@/lib/errors';

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * @route GET /api/projects/:id/taught
 * @param params - Route params; `id` is the source `Project.id`.
 * @returns 200 `{ ok: true, data: TaughtRow[] }`. An empty array means the
 *   project hasn't taught a lesson that informed a later project — not an error.
 * @throws {ZodError} → 400 VALIDATION_ERROR, if `id` is missing/empty.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await params);
		const rows = await getProjectTaughtLessons(id);
		return success(rows);
	} catch (err) {
		return handleRouteError(err);
	}
}
