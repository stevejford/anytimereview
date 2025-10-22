import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import type { MiddlewareHandler } from "hono";
import { db, user as userSchema } from "@my-better-t-app/db";
import { eq } from "drizzle-orm";
import type { CloudflareBindings } from "../types/bindings";

export type DbUser = {
	id: string;
	email: string;
	role: string;
	name: string;
};

export type AuthenticatedVariables = {
	Variables: {
		user: DbUser | null;
	};
};

/**
 * Per-request Clerk auth middleware wrapper.
 * Reads CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from c.env at runtime.
 * This ensures environment variables are available during request processing.
 */
export const authMiddleware: MiddlewareHandler<
	AuthenticatedVariables & { Bindings: CloudflareBindings }
> = async (c, next) => {
	const publishableKey = c.env?.CLERK_PUBLISHABLE_KEY;
	const secretKey = c.env?.CLERK_SECRET_KEY;

	// Warn if secrets are missing during development
	if (!publishableKey || !secretKey) {
		console.warn(
			"[Clerk Auth] Missing environment variables:",
			{ publishableKey: !!publishableKey, secretKey: !!secretKey }
		);
	}

	// Invoke clerkMiddleware with runtime-resolved keys
	return clerkMiddleware({
		publishableKey: publishableKey || "",
		secretKey: secretKey || "",
	})(c, next);
};

export const requireAuth: MiddlewareHandler<AuthenticatedVariables> = async (
	c,
	next,
) => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Fetch user from local database using Clerk user ID
	const [dbUser] = await db
		.select({
			id: userSchema.id,
			email: userSchema.email,
			role: userSchema.role,
			name: userSchema.name,
		})
		.from(userSchema)
		.where(eq(userSchema.id, auth.userId))
		.limit(1);

	if (!dbUser) {
		return c.json({ error: "User not found. Please ensure your account is synced." }, 401);
	}

	c.set("user", dbUser);
	return next();
};

export const requireAdmin: MiddlewareHandler<AuthenticatedVariables> = async (
	c,
	next,
) => {
	const auth = getAuth(c);
	if (!auth?.userId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Fetch user from local database
	const [dbUser] = await db
		.select({
			id: userSchema.id,
			email: userSchema.email,
			role: userSchema.role,
			name: userSchema.name,
		})
		.from(userSchema)
		.where(eq(userSchema.id, auth.userId))
		.limit(1);

	if (!dbUser) {
		return c.json({ error: "User not found" }, 401);
	}

	if (dbUser.role !== "admin") {
		return c.json({ error: "Admin access required" }, 403);
	}

	c.set("user", dbUser);
	return next();
};


