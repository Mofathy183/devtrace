/**
 * @module app/api/categories/[id]/route
 * Serves a single category's name plus its 2-hop technology/project
 * detail (Category <- Technology <- Project).
 */
import { z } from 'zod';
import { getCategoryById, getCategoryDetail } from '@/lib/queries/categories';
import { success, failure, handleRouteError } from '@/lib/errors';

const paramsSchema = z.object({ id: z.string().min(1) });

/**
 * @route GET /api/categories/:id
 * @returns 200 `{ ok: true, data: { category, technologies } }` if found.
 * @returns 404 `{ ok: false, error: { code: "NOT_FOUND" } }` if no such category.
 * @throws {ZodError} → 400 VALIDATION_ERROR, if `id` is missing/empty.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = paramsSchema.parse(await params);
		const category = await getCategoryById(id);
		if (!category) {
			return failure(
				'NOT_FOUND',
				`No category found with id "${id}".`,
				404
			);
		}
		const technologies = await getCategoryDetail(id);
		return success({ category, technologies });
	} catch (err) {
		return handleRouteError(err);
	}
}
