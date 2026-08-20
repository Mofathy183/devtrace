/**
 * @module app/api/projects/[id]/route
 * Fetches a single Project's display data. The project detail page uses
 * this instead of deriving a name from the URL slug, and returns 404 so
 * the frontend can distinguish "project doesn't exist" from "project
 * exists but has no recorded influence."
 */
import { z } from 'zod';
import { getProjectById } from '@/lib/queries/projects';
import { success, failure, handleRouteError } from '@/lib/errors';

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * @route GET /api/projects/:id
 * @returns 200 `{ ok: true, data: ProjectRow }` if found.
 * @returns 404 `{ ok: false, error: { code: "NOT_FOUND" } }` if no such project.
 * @throws {ZodError} → 400 VALIDATION_ERROR, if `id` is missing/empty.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await params);
		const project = await getProjectById(id);
		if (!project) {
			return failure(
				'NOT_FOUND',
				`No project found with id "${id}".`,
				404
			);
		}
		return success(project);
	} catch (err) {
		return handleRouteError(err);
	}
}
