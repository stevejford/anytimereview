import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db, user as userTable } from "@my-better-t-app/db";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import { getStripeClient } from "../lib/stripe-client";
import {
	createConnectAccount,
	createAccountLink,
	getAccountStatus,
	updateUserConnectAccount,
} from "../lib/stripe-connect";
import type { CloudflareBindings } from "../types/bindings";

const router = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

router.use("*", authMiddleware);

const onboardingSchema = z.object({
	returnUrl: z.string().url(),
	refreshUrl: z.string().url(),
});

router.post("/onboarding", requireAuth, async (c) => {
	const authUser = c.get("user");
	if (!authUser) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Get full user from database with custom fields
	const [dbUser] = await db
		.select()
		.from(userTable)
		.where(eq(userTable.id, authUser.id))
		.limit(1);

	if (!dbUser) {
		return c.json({ error: "User not found" }, 404);
	}

	const body = await c.req.json().catch(() => ({}));
	const parsed = onboardingSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	try {
		const stripe = getStripeClient(c.env);

		let accountId = dbUser.stripeConnectAccountId ?? null;
		if (!accountId) {
			accountId = await createConnectAccount(stripe, dbUser.email ?? "");
			await updateUserConnectAccount(dbUser.id, accountId, false, false);
		}

		const { returnUrl, refreshUrl } = parsed.data;
		const accountLink = await createAccountLink(stripe, accountId, refreshUrl, returnUrl);

		return c.json({ accountLinkUrl: accountLink, accountId });
	} catch (error) {
		console.error("connect onboarding failed", { userId: authUser?.id, error });
		return c.json({ error: "Unable to start onboarding" }, 500);
	}
});

router.post("/refresh", requireAuth, async (c) => {
	const authUser = c.get("user");
	if (!authUser) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Get full user from database with custom fields
	const [dbUser] = await db
		.select()
		.from(userTable)
		.where(eq(userTable.id, authUser.id))
		.limit(1);

	if (!dbUser || !dbUser.stripeConnectAccountId) {
		return c.json({ error: "No onboarding session" }, 404);
	}

	const body = await c.req.json().catch(() => ({}));
	const parsed = onboardingSchema.safeParse(body);
	if (!parsed.success) {
		return c.json({ error: "Invalid request" }, 400);
	}

	try {
		const stripe = getStripeClient(c.env);
		const { returnUrl, refreshUrl } = parsed.data;
		const accountLink = await createAccountLink(
			stripe,
			dbUser.stripeConnectAccountId,
			refreshUrl,
			returnUrl,
		);

		return c.json({ accountLinkUrl: accountLink, accountId: dbUser.stripeConnectAccountId });
	} catch (error) {
		console.error("connect onboarding refresh failed", {
			userId: authUser?.id,
			error,
		});
		return c.json({ error: "Unable to refresh onboarding link" }, 500);
	}
});

router.get("/status", requireAuth, async (c) => {
	const authUser = c.get("user");
	if (!authUser) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Get full user from database with custom fields
	const [dbUser] = await db
		.select()
		.from(userTable)
		.where(eq(userTable.id, authUser.id))
		.limit(1);

	if (!dbUser) {
		return c.json({ error: "User not found" }, 404);
	}

	try {
		if (!dbUser.stripeConnectAccountId) {
			return c.json({
				accountId: null,
				onboardingComplete: false,
				chargesEnabled: false,
				payoutsEnabled: false,
				detailsSubmitted: false,
			});
		}

		const stripe = getStripeClient(c.env);
		const status = await getAccountStatus(stripe, dbUser.stripeConnectAccountId);

		await updateUserConnectAccount(
			dbUser.id,
			dbUser.stripeConnectAccountId,
			status.chargesEnabled,
			status.payoutsEnabled,
		);

		return c.json({
			accountId: dbUser.stripeConnectAccountId,
			onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
			chargesEnabled: status.chargesEnabled,
			payoutsEnabled: status.payoutsEnabled,
			detailsSubmitted: status.detailsSubmitted,
		});
	} catch (error) {
		console.error("connect status failed", { userId: authUser?.id, error });
		return c.json({ error: "Unable to load Connect status" }, 500);
	}
});

export default router;

