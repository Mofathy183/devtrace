/**
 * @module app/api/projects/route
 * Lists every Project node in the graph, ordered by start date. The
 * baseline listing endpoint the frontend's project list view reads from.
 */
import { runQuery } from '@/lib/db';
import { success, handleRouteError } from '@/lib/errors';

/** One row returned by the project list query. */
type ProjectListRow = {
	id: string;
	name: string;
	summary: string;
	startedAt: string;
};

/**
 * @route GET /api/projects
 * @returns 200 `{ ok: true, data: ProjectListRow[] }`, ordered by `startedAt` ascending.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET() {
	try {
		const rows = await runQuery<ProjectListRow>(
			`MATCH (p:Project)
			RETURN p.id AS id, p.name AS name, p.summary AS summary, p.startedAt AS startedAt
			ORDER BY p.startedAt`
		);
		return success(rows);
	} catch (err) {
		return handleRouteError(err);
	}
}
