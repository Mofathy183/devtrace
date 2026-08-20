/**
 * @module app/api/chains/route
 * Serves the required variable-length path query: every chain of
 * influence between projects, of arbitrary depth up to the query's
 * bound, serialized to a JSON-safe shape via {@link serializeChainRows}.
 */
import { getInfluenceChains } from '@/lib/queries/influence';
import { serializeChainRows } from '@/lib/queries/serialize-path';
import { success, handleRouteError } from '@/lib/errors';

/**
 * @route GET /api/chains
 * @returns 200 `{ ok: true, data: ChainResult[] }` — up to 25 influence chains.
 * @throws {DbUnavailableError} → 503, if CognoDB is unreachable.
 */
export async function GET() {
	try {
		const rows = await getInfluenceChains();
		return success(serializeChainRows(rows));
	} catch (err) {
		return handleRouteError(err);
	}
}
