import { eq } from "drizzle-orm";
import Stripe from "stripe";

import { db, user } from "@my-better-t-app/db";

export async function createConnectAccount(
	stripe: Stripe,
	email: string,
	country = "US",
): Promise<string> {
	const account = await stripe.accounts.create({
		type: "express",
		email,
		country,
		business_type: "individual",
		capabilities: {
			card_payments: { requested: true },
			transfers: { requested: true },
		},
		settings: {
			payouts: {
				schedule: {
					interval: "monthly",
					monthly_anchor: 1,
				},
			},
		},
	});

	return account.id;
}

export async function createAccountLink(
	stripe: Stripe,
	accountId: string,
	refreshUrl: string,
	returnUrl: string,
): Promise<string> {
	const link = await stripe.accountLinks.create({
		account: accountId,
		refresh_url: refreshUrl,
		return_url: returnUrl,
		type: "account_onboarding",
	});

	return link.url;
}

export async function getAccountStatus(
	stripe: Stripe,
	accountId: string,
): Promise<{
		chargesEnabled: boolean;
		payoutsEnabled: boolean;
		detailsSubmitted: boolean;
	}> {
	const account = await stripe.accounts.retrieve(accountId);

	return {
		chargesEnabled: account.charges_enabled ?? false,
		payoutsEnabled: account.payouts_enabled ?? false,
		detailsSubmitted: account.details_submitted ?? false,
	};
}

export async function updateUserConnectAccount(
	userId: string,
	accountId: string,
	chargesEnabled: boolean,
	payoutsEnabled: boolean,
): Promise<void> {
	await db
		.update(user)
		.set({
			stripeConnectAccountId: accountId,
			stripeConnectChargesEnabled: chargesEnabled,
			stripeConnectPayoutsEnabled: payoutsEnabled,
			stripeConnectOnboardingComplete: chargesEnabled && payoutsEnabled,
		})
		.where(eq(user.id, userId));
}

