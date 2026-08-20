/**
 * @module lib/queries/serialize-path
 * Converts a raw Neo4j `Path` object (what the driver hands back for
 * `RETURN path`) into a plain, JSON-safe shape. A driver `Path` carries
 * `Node`/`Relationship` objects with internal `Integer`-typed identity
 * fields — never return one directly from an API route; it either
 * serializes to a useless blob or breaks `JSON.stringify` depending on
 * driver version. This is the one place in the app that unwraps it.
 */
import type { Path, Node as Neo4jNode } from 'neo4j-driver';

/** One node touched by a chain, flattened to what the UI needs. */
export type ChainNode = {
	id: string;
	label: string;
	name: string;
};

/** One relationship hop within a chain. */
export type ChainStep = {
	type: string;
	from: string;
	to: string;
};

/** A single influence chain, ready to render or send over JSON. */
export type ChainResult = {
	nodes: ChainNode[];
	steps: ChainStep[];
};

/**
 * Picks a display name off a node's properties. Project/Technology nodes
 * use `name`; Lesson nodes use `title`. Falls back to the node's own id
 * so a schema change never renders a blank label.
 */
function nodeName(node: Neo4jNode): string {
	const props = node.properties as Record<string, unknown>;
	return (props.name ?? props.title ?? props.id ?? 'Unknown') as string;
}

function toChainNode(node: Neo4jNode): ChainNode {
	return {
		id: node.elementId,
		label: node.labels[0] ?? 'Node',
		name: nodeName(node),
	};
}

/**
 * Flattens a driver `Path` into `{ nodes, steps }`. Nodes are
 * deduplicated by `elementId` (a path can revisit... though our bounded
 * traversal shouldn't) and returned in first-seen order; steps preserve
 * the path's original hop order.
 *
 * @param path - The raw `Path` value from a Cypher `RETURN path` row.
 * @returns A JSON-safe chain: every distinct node once, plus ordered hops.
 */
export function serializePath(path: Path): ChainResult {
	const nodesById = new Map<string, ChainNode>();
	const steps: ChainStep[] = [];

	nodesById.set(path.start.elementId, toChainNode(path.start));

	for (const segment of path.segments) {
		nodesById.set(segment.start.elementId, toChainNode(segment.start));
		nodesById.set(segment.end.elementId, toChainNode(segment.end));
		steps.push({
			type: segment.relationship.type,
			from: segment.start.elementId,
			to: segment.end.elementId,
		});
	}

	return { nodes: [...nodesById.values()], steps };
}

/**
 * Maps every `{ path }` row from {@link getInfluenceChains} through
 * {@link serializePath}, in order.
 *
 * @param rows - Raw rows as returned by `runQuery` for a `RETURN path` query.
 * @returns One serialized chain per row.
 */
export function serializeChainRows(rows: { path: Path }[]): ChainResult[] {
	return rows.map((row) => serializePath(row.path));
}
