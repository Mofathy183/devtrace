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

/** One row of {@link getProjectTaughtLessons}'s result set. */
export type TaughtRow = {
	lessonTitle: string;
	toProject: string;
};

/**
 * Outgoing influence: lessons taught by the given project that went on to
 * inform a later project. This is the mirror of {@link getProjectInfluence}
 * — that function answers "what influenced this project," this answers
 * "what did this project teach forward." An origin project (nothing
 * preceded it) will always return an empty array from
 * {@link getProjectInfluence} but can still return real rows here.
 *
 * @param projectId - The `Project.id` whose taught lessons to look up.
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns Rows of `{ lessonTitle, toProject }`, one per lesson→informed-project edge.
 * @throws {DbUnavailableError} If the underlying query fails (propagated from `runQuery`/`runner`).
 */
export async function getProjectTaughtLessons(
	projectId: string,
	runner: typeof runQuery = runQuery
) {
	return runner<TaughtRow>(
		`MATCH (source:Project {id: $projectId})-[:TAUGHT_LESSON]->(l:Lesson)-[:INFORMED]->(later:Project)
		RETURN l.title AS lessonTitle, later.name AS toProject`,
		{ projectId }
	);
}
