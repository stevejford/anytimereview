import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { domains } from "./schema/domains";
import { listings } from "./schema/listings";
import { user } from "./schema/auth";

// Load environment variables from apps/server/.env
config({ path: "../../apps/server/.env" });

// Seed data matching the frontend seed-data.ts
const SEED_DOMAINS = [
	{ id: "seed-domain-1", fqdn: "cloudmetrics.com" },
	{ id: "seed-domain-2", fqdn: "devtools.com" },
	{ id: "seed-domain-3", fqdn: "apigateway.com" },
	{ id: "seed-domain-4", fqdn: "microservices.io" },
	{ id: "seed-domain-5", fqdn: "automationhub.com" },
	{ id: "seed-domain-6", fqdn: "datapipeline.com" },
	{ id: "seed-domain-7", fqdn: "cloudnative.io" },
	{ id: "seed-domain-8", fqdn: "kubernetes.app" },
	{ id: "seed-domain-9", fqdn: "containers.dev" },
	{ id: "seed-domain-10", fqdn: "serverless.io" },
	{ id: "seed-domain-11", fqdn: "edgecompute.com" },
	{ id: "seed-domain-12", fqdn: "webassembly.dev" },
	{ id: "seed-domain-13", fqdn: "graphql.app" },
	{ id: "seed-domain-14", fqdn: "restapi.io" },
	{ id: "seed-domain-15", fqdn: "webhooks.dev" },
	{ id: "seed-domain-16", fqdn: "paymentflow.com" },
	{ id: "seed-domain-17", fqdn: "cryptowallet.io" },
	{ id: "seed-domain-18", fqdn: "tradingbot.com" },
	{ id: "seed-domain-19", fqdn: "investmentapp.com" },
	{ id: "seed-domain-20", fqdn: "budgetpro.com" },
	{ id: "seed-domain-21", fqdn: "fitnesstrack.com" },
	{ id: "seed-domain-22", fqdn: "workoutplan.io" },
	{ id: "seed-domain-23", fqdn: "yogastudio.app" },
	{ id: "seed-domain-24", fqdn: "nutritionplan.com" },
	{ id: "seed-domain-25", fqdn: "mentalhealth.com" },
	{ id: "seed-domain-26", fqdn: "meditation.app" },
	{ id: "seed-domain-27", fqdn: "learningpath.com" },
	{ id: "seed-domain-28", fqdn: "academy.io" },
	{ id: "seed-domain-29", fqdn: "skillbuilder.com" },
	{ id: "seed-domain-30", fqdn: "courseplatform.com" },
	{ id: "seed-domain-31", fqdn: "tutorconnect.com" },
	{ id: "seed-domain-32", fqdn: "studygroup.app" },
	{ id: "seed-domain-33", fqdn: "travelguide.com" },
	{ id: "seed-domain-34", fqdn: "bookingpro.io" },
	{ id: "seed-domain-35", fqdn: "hoteldeals.com" },
	{ id: "seed-domain-36", fqdn: "flightfinder.app" },
	{ id: "seed-domain-37", fqdn: "adventuretrips.com" },
	{ id: "seed-domain-38", fqdn: "localexperience.io" },
	{ id: "seed-domain-39", fqdn: "projecthub.com" },
	{ id: "seed-domain-40", fqdn: "teamcollab.io" },
	{ id: "seed-domain-41", fqdn: "workflowpro.app" },
	{ id: "seed-domain-42", fqdn: "taskflow.app" },
	{ id: "seed-domain-43", fqdn: "meetingscheduler.com" },
	{ id: "seed-domain-44", fqdn: "timetracker.io" },
	{ id: "seed-domain-45", fqdn: "socialmedia.app" },
	{ id: "seed-domain-46", fqdn: "contentcreator.io" },
	{ id: "seed-domain-47", fqdn: "influencertools.com" },
	{ id: "seed-domain-48", fqdn: "brandbuilder.app" },
	{ id: "seed-domain-49", fqdn: "marketingautomation.io" },
	{ id: "seed-domain-50", fqdn: "creativehub.co" },
];

const SEED_LISTINGS = [
	{ id: "seed-1", domainId: "seed-domain-1", mode: "exclusive" as const, pricePeriodCents: 8900, daysAgo: 25 },
	{ id: "seed-2", domainId: "seed-domain-2", mode: "exclusive" as const, pricePeriodCents: 45000, daysAgo: 28 },
	{ id: "seed-3", domainId: "seed-domain-3", mode: "exclusive" as const, pricePeriodCents: 65000, daysAgo: 20 },
	{ id: "seed-4", domainId: "seed-domain-4", mode: "shared_slugs" as const, pricePeriodCents: 18000, daysAgo: 15 },
	{ id: "seed-5", domainId: "seed-domain-5", mode: "shared_slugs" as const, pricePeriodCents: 22000, daysAgo: 12 },
	{ id: "seed-6", domainId: "seed-domain-6", mode: "exclusive" as const, pricePeriodCents: 38000, daysAgo: 22 },
	{ id: "seed-7", domainId: "seed-domain-7", mode: "shared_slugs" as const, pricePeriodCents: 27000, daysAgo: 18 },
	{ id: "seed-8", domainId: "seed-domain-8", mode: "exclusive" as const, pricePeriodCents: 72000, daysAgo: 29 },
	{ id: "seed-9", domainId: "seed-domain-9", mode: "shared_slugs" as const, pricePeriodCents: 15000, daysAgo: 10 },
	{ id: "seed-10", domainId: "seed-domain-10", mode: "exclusive" as const, pricePeriodCents: 52000, daysAgo: 27 },
	{ id: "seed-11", domainId: "seed-domain-11", mode: "shared_slugs" as const, pricePeriodCents: 19500, daysAgo: 8 },
	{ id: "seed-12", domainId: "seed-domain-12", mode: "exclusive" as const, pricePeriodCents: 41000, daysAgo: 24 },
	{ id: "seed-13", domainId: "seed-domain-13", mode: "shared_slugs" as const, pricePeriodCents: 16500, daysAgo: 11 },
	{ id: "seed-14", domainId: "seed-domain-14", mode: "exclusive" as const, pricePeriodCents: 33000, daysAgo: 19 },
	{ id: "seed-15", domainId: "seed-domain-15", mode: "shared_slugs" as const, pricePeriodCents: 14000, daysAgo: 7 },
	{ id: "seed-16", domainId: "seed-domain-16", mode: "shared_slugs" as const, pricePeriodCents: 34000, daysAgo: 26 },
	{ id: "seed-17", domainId: "seed-domain-17", mode: "exclusive" as const, pricePeriodCents: 95000, daysAgo: 30 },
	{ id: "seed-18", domainId: "seed-domain-18", mode: "shared_slugs" as const, pricePeriodCents: 28000, daysAgo: 21 },
	{ id: "seed-19", domainId: "seed-domain-19", mode: "exclusive" as const, pricePeriodCents: 67000, daysAgo: 23 },
	{ id: "seed-20", domainId: "seed-domain-20", mode: "shared_slugs" as const, pricePeriodCents: 9500, daysAgo: 14 },
	{ id: "seed-21", domainId: "seed-domain-21", mode: "exclusive" as const, pricePeriodCents: 24000, daysAgo: 16 },
	{ id: "seed-22", domainId: "seed-domain-22", mode: "shared_slugs" as const, pricePeriodCents: 11000, daysAgo: 9 },
	{ id: "seed-23", domainId: "seed-domain-23", mode: "exclusive" as const, pricePeriodCents: 36000, daysAgo: 13 },
	{ id: "seed-24", domainId: "seed-domain-24", mode: "shared_slugs" as const, pricePeriodCents: 12000, daysAgo: 6 },
	{ id: "seed-25", domainId: "seed-domain-25", mode: "exclusive" as const, pricePeriodCents: 89000, daysAgo: 30 },
	{ id: "seed-26", domainId: "seed-domain-26", mode: "shared_slugs" as const, pricePeriodCents: 17500, daysAgo: 5 },
	{ id: "seed-27", domainId: "seed-domain-27", mode: "exclusive" as const, pricePeriodCents: 42000, daysAgo: 25 },
	{ id: "seed-28", domainId: "seed-domain-28", mode: "exclusive" as const, pricePeriodCents: 31000, daysAgo: 3 },
	{ id: "seed-29", domainId: "seed-domain-29", mode: "shared_slugs" as const, pricePeriodCents: 13000, daysAgo: 4 },
	{ id: "seed-30", domainId: "seed-domain-30", mode: "shared_slugs" as const, pricePeriodCents: 23000, daysAgo: 1 },
	{ id: "seed-31", domainId: "seed-domain-31", mode: "exclusive" as const, pricePeriodCents: 29000, daysAgo: 17 },
	{ id: "seed-32", domainId: "seed-domain-32", mode: "shared_slugs" as const, pricePeriodCents: 10500, daysAgo: 2 },
	{ id: "seed-33", domainId: "seed-domain-33", mode: "exclusive" as const, pricePeriodCents: 48000, daysAgo: 28 },
	{ id: "seed-34", domainId: "seed-domain-34", mode: "shared_slugs" as const, pricePeriodCents: 25000, daysAgo: 20 },
	{ id: "seed-35", domainId: "seed-domain-35", mode: "exclusive" as const, pricePeriodCents: 55000, daysAgo: 26 },
	{ id: "seed-36", domainId: "seed-domain-36", mode: "shared_slugs" as const, pricePeriodCents: 21000, daysAgo: 15 },
	{ id: "seed-37", domainId: "seed-domain-37", mode: "exclusive" as const, pricePeriodCents: 39000, daysAgo: 22 },
	{ id: "seed-38", domainId: "seed-domain-38", mode: "shared_slugs" as const, pricePeriodCents: 16000, daysAgo: 11 },
	{ id: "seed-39", domainId: "seed-domain-39", mode: "exclusive" as const, pricePeriodCents: 44000, daysAgo: 24 },
	{ id: "seed-40", domainId: "seed-domain-40", mode: "shared_slugs" as const, pricePeriodCents: 18500, daysAgo: 12 },
	{ id: "seed-41", domainId: "seed-domain-41", mode: "exclusive" as const, pricePeriodCents: 35000, daysAgo: 19 },
	{ id: "seed-42", domainId: "seed-domain-42", mode: "exclusive" as const, pricePeriodCents: 20500, daysAgo: 6 },
	{ id: "seed-43", domainId: "seed-domain-43", mode: "shared_slugs" as const, pricePeriodCents: 14500, daysAgo: 8 },
	{ id: "seed-44", domainId: "seed-domain-44", mode: "exclusive" as const, pricePeriodCents: 26000, daysAgo: 14 },
	{ id: "seed-45", domainId: "seed-domain-45", mode: "exclusive" as const, pricePeriodCents: 78000, daysAgo: 29 },
	{ id: "seed-46", domainId: "seed-domain-46", mode: "shared_slugs" as const, pricePeriodCents: 24500, daysAgo: 18 },
	{ id: "seed-47", domainId: "seed-domain-47", mode: "exclusive" as const, pricePeriodCents: 51000, daysAgo: 27 },
	{ id: "seed-48", domainId: "seed-domain-48", mode: "shared_slugs" as const, pricePeriodCents: 19000, daysAgo: 10 },
	{ id: "seed-49", domainId: "seed-domain-49", mode: "exclusive" as const, pricePeriodCents: 62000, daysAgo: 25 },
	{ id: "seed-50", domainId: "seed-domain-50", mode: "shared_slugs" as const, pricePeriodCents: 13500, daysAgo: 17 },
];

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL environment variable is not set");
	}

	console.log("🌱 Seeding database...");

	const sql = neon(databaseUrl);
	const db = drizzle(sql, { schema: { domains, listings, user } });

	// Create a dummy user ID for the seed data
	const SEED_USER_ID = "seed-user-1";

	try {
		// Insert seed user
		console.log("👤 Creating seed user...");
		await db.insert(user).values({
			id: SEED_USER_ID,
			name: "Seed User",
			email: "seed@example.com",
			role: "owner",
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}).onConflictDoNothing();
		console.log("✅ Seed user created");

		// Insert domains
		console.log("📦 Inserting domains...");
		for (const domain of SEED_DOMAINS) {
			await db.insert(domains).values({
				id: domain.id,
				ownerId: SEED_USER_ID,
				fqdn: domain.fqdn,
				verificationMethod: "manual",
				verificationStatus: "verified",
				verifiedAt: new Date(),
				onboardingMethod: "manual",
			}).onConflictDoNothing();
		}
		console.log(`✅ Inserted ${SEED_DOMAINS.length} domains`);

		// Insert listings
		console.log("📋 Inserting listings...");
		for (const listing of SEED_LISTINGS) {
			const createdAt = new Date(Date.now() - listing.daysAgo * 24 * 60 * 60 * 1000);
			await db.insert(listings).values({
				id: listing.id,
				domainId: listing.domainId,
				mode: listing.mode,
				pricePeriodCents: listing.pricePeriodCents,
				priceClickCents: null,
				currency: "USD",
				status: "active",
				createdAt,
				updatedAt: createdAt,
			}).onConflictDoNothing();
		}
		console.log(`✅ Inserted ${SEED_LISTINGS.length} listings`);

		console.log("🎉 Seeding complete!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	}
}

seed().catch((error) => {
	console.error(error);
	process.exit(1);
});

