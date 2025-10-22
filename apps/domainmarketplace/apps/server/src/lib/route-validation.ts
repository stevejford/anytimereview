import { db, eq } from "@my-better-t-app/db";
import { routes } from "@my-better-t-app/db/schema/rentals";

const REDIRECT_CODES = new Set([301, 302, 307, 308]);

const PATH_REGEX = /^(\/[^?#]*)?$/;

export function normalizeRouteHost(host: string): string {
	return host.trim().toLowerCase();
}

export async function checkRouteConflict(
	rentalId: string,
	host: string,
	path: string,
	excludeRouteId?: string,
): Promise<boolean> {
	const normalizedHost = normalizeRouteHost(host);
	const normalizedPath = normalizeRoutePath(path);
	const conflict = await db.query.routes.findFirst({
		where: (route, { and, eq, ne }) =>
			and(
				eq(route.rentalId, rentalId),
				eq(route.host, normalizedHost),
				eq(route.path, normalizedPath),
				excludeRouteId ? ne(route.id, excludeRouteId) : undefined,
			),
		columns: {
			id: true,
		},
	});

	return Boolean(conflict);
}

export function validateRedirectCode(code: number): boolean {
	return REDIRECT_CODES.has(code);
}

export function normalizeRoutePath(path: string): string {
	if (!path) {
		return "/";
	}

	const trimmed = path.trim();
	if (!PATH_REGEX.test(trimmed)) {
		throw new Error("Path must start with '/' and not include query or hash");
	}

	if (trimmed === "") {
		return "/";
	}

	if (trimmed === "/") {
		return "/";
	}

	try {
		const decoded = decodeURI(trimmed);
		if (decoded === "/") {
			return "/";
		}
		const withoutTrailingSlash = decoded.replace(/\/+$/g, "");
		return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
	} catch {
		const withoutTrailingSlash = trimmed.replace(/\/+$/g, "");
		return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
	}
}

