/**
 * @module lib/queries/projects
 * Single-project lookup by id — backs the project detail page's real
 * name/summary and the 404 branch for an unknown project id.
 */
import { runQuery } from '../db';

export type ProjectRow = {
	id: string;
	name: string;
	summary: string;
	startedAt: string;
};

/**
 * Looks up a single Project node by id.
 *
 * @param projectId - The `Project.id` to fetch.
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns The matching project row, or `null` if no project has that id.
 * @throws {DbUnavailableError} If the underlying query fails.
 */
export async function getProjectById(
	projectId: string,
	runner: typeof runQuery = runQuery
): Promise<ProjectRow | null> {
	const rows = await runner<ProjectRow>(
		`MATCH (p:Project {id: $projectId})
        RETURN p.id AS id, p.name AS name, p.summary AS summary, p.startedAt AS startedAt`,
		{ projectId }
	);
	return rows[0] ?? null;
}
