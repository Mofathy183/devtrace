/**
 * @module lib/queries/influence
 * The two Cypher queries required by the brief: a bounded multi-hop
 * traversal (project influence) and a variable-length path query
 * (arbitrary-depth influence chains) — the query this whole use case
 * exists to make natural, since it's the one that gets painful as a
 * recursive CTE in a relational schema.
 */
import type { Path } from 'neo4j-driver';
import { runQuery } from '../db';

/** One row of {@link getProjectInfluence}'s result set. */
export type InfluenceRow = {
	lessonTitle: string;
	fromProject: string;
	technology: string;
};

/**
 * Multi-hop traversal (3 hops): finds every lesson taught by an earlier
 * project that informed the given project, and which of the given
 * project's technologies that lesson is connected to via
 * `earlier -[:TAUGHT_LESSON]-> Lesson -[:INFORMED]-> target -[:USES]-> Technology`.
 *
 * @remarks
 * This answers "what lessons from earlier projects influenced the
 * technology choices in this project?" — the query the README's UI
 * surfaces visually as a path diagram.
 * @param projectId - The `Project.id` to find influence for (e.g. `"pyledger"`).
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns Rows of `{ lessonTitle, fromProject, technology }`.
 * @throws {DbUnavailableError} If the underlying query fails (propagated from `runQuery`/`runner`).
 */
export async function getProjectInfluence(
	projectId: string,
	runner: typeof runQuery = runQuery
) {
	return runner<InfluenceRow>(
		`MATCH (earlier:Project)-[:TAUGHT_LESSON]->(l:Lesson)-[:INFORMED]->(target:Project {id: $projectId})-[:USES]->(t:Technology)
     	RETURN l.title AS lessonTitle, earlier.name AS fromProject, t.name AS technology`,
		{ projectId }
	);
}

/**
 * Variable-length path query: finds chains of influence of arbitrary
 * length by traversing alternating `TAUGHT_LESSON`/`INFORMED` edges
 * between projects, up to `maxDepth` project-to-project hops.
 *
 * @remarks
 * This is the "relational-DB-unfriendly" query required by the brief —
 * equivalent to a recursive CTE in SQL, expressed here as a single
 * bounded variable-length path pattern. `maxDepth` is doubled internally
 * because each project-to-project hop traverses two edges
 * (`TAUGHT_LESSON` then `INFORMED`).
 * @param maxDepth - Maximum number of project-to-project hops to follow. Defaults to 5.
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns Up to 25 matching paths, each under the `path` key.
 * @throws {DbUnavailableError} If the underlying query fails (propagated from `runQuery`/`runner`).
 */
export async function getInfluenceChains(
	maxDepth = 5,
	runner: typeof runQuery = runQuery
) {
	return runner<{ path: Path }>(
		`MATCH path = (start:Project)-[:TAUGHT_LESSON|INFORMED*1..${maxDepth * 2}]->(end:Project)
     WHERE start <> end
     RETURN path
     LIMIT 25`,
		{}
	);
}
