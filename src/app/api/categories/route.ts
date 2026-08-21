/**
 * @module app/api/categories/route
 * Lists every SkillCategory with its technology count.
 */
import { getCategories } from '@/lib/queries/categories';
import { success, handleRouteError } from '@/lib/errors';

/**
 * @route GET /api/categories
 * @returns 200 `{ ok: true, data: CategoryRow[] }`, ordered by name.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET() {
	try {
		const rows = await getCategories();
		return success(rows);
	} catch (err) {
		return handleRouteError(err);
	}
}
