/**
 * @module app/api/projects/[id]/influence/route
 * Serves the required multi-hop traversal: which lessons from earlier
 * projects informed the technology choices in the given project.
 */
import { z } from 'zod';
import { getProjectInfluence } from '@/lib/queries/influence';
import { success, handleRouteError } from '@/lib/errors';

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * @route GET /api/projects/:id/influence
 * @param params - Route params; `id` is the target `Project.id`.
 * @returns 200 `{ ok: true, data: InfluenceRow[] }`. An empty array means
 *   the project exists but has no recorded influence chain — not an error.
 * @throws {ZodError} → 400 VALIDATION_ERROR, if `id` is missing/empty.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await params);
		const rows = await getProjectInfluence(id);
		return success(rows);
	} catch (err) {
		return handleRouteError(err);
	}
}
