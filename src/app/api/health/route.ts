/**
 * @module app/api/health/route
 * Health check endpoint — verifies live connectivity to CognoDB. Used to
 * fail fast and visibly if the instance is unreachable, rather than
 * surfacing a confusing error on the first real query a user triggers.
 */
import { verifyConnection } from '@/lib/db';
import { success, handleRouteError } from '@/lib/errors';

/**
 * @route GET /api/health
 * @returns 200 `{ ok: true, data: { status: "connected" } }` if CognoDB is reachable.
 * @throws {DbUnavailableError} → 503, if CognoDB cannot be reached.
 */
export async function GET() {
	try {
		await verifyConnection();
		return success({ status: 'connected' });
	} catch (err) {
		return handleRouteError(err);
	}
}
