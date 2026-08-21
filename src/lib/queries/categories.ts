/**
 * @module lib/queries/categories
 * Category-level views: every SkillCategory with a technology count, a
 * single-category existence/name lookup, and — for one category — the
 * technologies in it and the projects that use them
 * (Category <-BELONGS_TO_CATEGORY- Technology <-USES- Project, 2 hops).
 *
 * @remarks
 * `count()` in Cypher returns a Neo4j `Integer` (a `{ low, high }` pair,
 * since Bolt integers can exceed JS's safe integer range) — not a plain
 * JS number. Never pass one straight to a component; convert with
 * {@link toJsNumber} first, the same way {@link serializePath} unwraps
 * driver-specific `Path`/`Node` objects before they reach the UI.
 */
import neo4j from 'neo4j-driver';
import { runQuery } from '@/lib/db';

/**
 * Converts a Neo4j `Integer` (or a value that's already a plain number)
 * to a plain JS number. Safe to call on values that never touched the
 * driver, e.g. numbers a test's fake runner returns directly.
 */
function toJsNumber(value: unknown): number {
	return neo4j.isInt(value) ? value.toNumber() : Number(value);
}

/** Raw shape returned by the driver before {@link toJsNumber} normalizes the count. */
type RawCategoryRow = { id: string; name: string; technologyCount: unknown };

/** One row of {@link getCategories}'s result set. */
export type CategoryRow = {
	id: string;
	name: string;
	technologyCount: number;
};

/**
 * Lists every SkillCategory with how many technologies belong to it.
 * Uses OPTIONAL MATCH so a category with zero technologies still returns
 * a row with count 0, rather than being silently dropped.
 *
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns Rows of `{ id, name, technologyCount }`, ordered by name.
 * @throws {DbUnavailableError} If the underlying query fails.
 */
export async function getCategories(
	runner: typeof runQuery = runQuery
): Promise<CategoryRow[]> {
	const rows = await runner<RawCategoryRow>(
		`MATCH (c:SkillCategory)
		 OPTIONAL MATCH (c)<-[:BELONGS_TO_CATEGORY]-(t:Technology)
		 RETURN c.id AS id, c.name AS name, count(t) AS technologyCount
		 ORDER BY c.name`
	);
	return rows.map((r) => ({
		id: r.id,
		name: r.name,
		technologyCount: toJsNumber(r.technologyCount),
	}));
}

/** A single SkillCategory's identity — used to distinguish "not found" from "empty". */
export type CategoryInfo = { id: string; name: string };

/**
 * Looks up a single SkillCategory node by id.
 *
 * @param categoryId - The `SkillCategory.id` to fetch.
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns The matching category, or `null` if no category has that id.
 * @throws {DbUnavailableError} If the underlying query fails.
 */
export async function getCategoryById(
	categoryId: string,
	runner: typeof runQuery = runQuery
): Promise<CategoryInfo | null> {
	const rows = await runner<CategoryInfo>(
		`MATCH (c:SkillCategory {id: $categoryId})
		 RETURN c.id AS id, c.name AS name`,
		{ categoryId }
	);
	return rows[0] ?? null;
}

/** One row of {@link getCategoryDetail}'s result set. */
export type CategoryTechRow = { technology: string; project: string };

/**
 * Two-hop traversal: every technology in the given category, paired with
 * every project that uses it (`Category <- Technology <- Project`).
 *
 * @param categoryId - The `SkillCategory.id` to look up.
 * @param runner - Optional override for the query executor; used by unit
 *   tests to inject a fake without a real driver. Defaults to {@link runQuery}.
 * @returns Rows of `{ technology, project }`, ordered by technology then project.
 * @throws {DbUnavailableError} If the underlying query fails.
 */
export async function getCategoryDetail(
	categoryId: string,
	runner: typeof runQuery = runQuery
) {
	return runner<CategoryTechRow>(
		`MATCH (c:SkillCategory {id: $categoryId})<-[:BELONGS_TO_CATEGORY]-(t:Technology)<-[:USES]-(p:Project)
		 RETURN t.name AS technology, p.name AS project
		 ORDER BY t.name, p.name`,
		{ categoryId }
	);
}
