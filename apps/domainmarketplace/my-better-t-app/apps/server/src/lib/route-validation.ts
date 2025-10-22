import { and, eq, not } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { routes } from "@my-better-t-app/db/schema/hires";

const ALLOWED_REDIRECT_CODES = new Set([301, 302, 307, 308]);

export async function checkRouteConflict({
	hireId,
	host,
	path,
	routeId,
}: {
	hireId: string;
	host: string;
	path: string;
	routeId?: string;
}): Promise<boolean> {
	const conditions = [
		eq(routes.hireId, hireId),
		eq(routes.host, host),
		eq(routes.path, path),
	];

	if (routeId) {
		conditions.push(not(eq(routes.id, routeId)));
	}

	const existing = await db
		.select({ id: routes.id })
		.from(routes)
		.where(and(...conditions))
		.limit(1);

	return existing.length > 0;
}

export function validateRedirectCode(code: number): boolean {
	return ALLOWED_REDIRECT_CODES.has(code);
}


