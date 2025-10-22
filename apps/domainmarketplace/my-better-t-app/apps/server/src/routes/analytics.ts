import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@my-better-t-app/db";
import { clickRollups } from "@my-better-t-app/db/schema/analytics";
import { hires } from "@my-better-t-app/db/schema/hires";
import { listings } from "@my-better-t-app/db/schema/listings";
import { domains } from "@my-better-t-app/db/schema/domains";

import {
	authMiddleware,
	requireAuth,
	type AuthenticatedVariables,
} from "../middleware/auth";
import type { CloudflareBindings } from "../types/bindings";
import {
	queryBotBreakdown,
	queryGeoBreakdown,
	queryReferrerBreakdown,
	queryTimeSeriesData,
} from "../lib/analytics-queries";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 30;

const isoDateSchema = z
	.string()
	.regex(DATE_REGEX, "Date must be in YYYY-MM-DD format")
	.refine(isValidDateString, {
		message: "Invalid calendar date",
	});

const analyticsParamsSchema = z
	.object({
		range: z.enum(["7d", "30d", "90d"]).optional(),
		startDate: isoDateSchema.optional(),
		endDate: isoDateSchema.optional(),
	})
	.refine(
		(value) =>
			!value.range || (!value.startDate && !value.endDate),
		{
			message: "Cannot specify range alongside explicit start or end dates",
		},
	)
	.refine(
		(value) => {
			if (value.startDate && value.endDate) {
				const start = new Date(`${value.startDate}T00:00:00Z`);
				const end = new Date(`${value.endDate}T23:59:59.999Z`);
				return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end;
			}
			return true;
		},
		{
			message: "startDate must be before endDate",
		},
	);

function resolveDateRange(params: z.infer<typeof analyticsParamsSchema>): {
	startDate: string;
	endDate: string;
} {
	const today = new Date();
	const todayIso = toIsoDate(today);

	if (params.range) {
		const days = Number(params.range.replace("d", ""));
		const start = new Date(today.getTime() - (days - 1) * DAY_IN_MS);
		return {
			startDate: toIsoDate(start),
			endDate: todayIso,
		};
	}

	if (params.startDate && params.endDate) {
		return {
			startDate: params.startDate,
			endDate: params.endDate,
		};
	}

	if (params.startDate && !params.endDate) {
		return {
			startDate: params.startDate,
			endDate: todayIso,
		};
	}

	if (!params.startDate && params.endDate) {
		const endDate = params.endDate;
		const endDateObj = new Date(`${endDate}T00:00:00Z`);
		const startDateObj = new Date(endDateObj.getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_IN_MS);
		return {
			startDate: toIsoDate(startDateObj),
			endDate,
		};
	}

	const defaultStart = new Date(today.getTime() - (DEFAULT_RANGE_DAYS - 1) * DAY_IN_MS);
	return {
		startDate: toIsoDate(defaultStart),
		endDate: todayIso,
	};
}

function toSummary(rows: Array<typeof clickRollups.$inferSelect>) {
	return rows.reduce(
		(acc, row) => {
			return {
				validClicks: acc.validClicks + row.validClicks,
				invalidClicks: acc.invalidClicks + row.invalidClicks,
			};
		},
		{ validClicks: 0, invalidClicks: 0 },
	);
}

function toCamelCaseDate(row: typeof clickRollups.$inferSelect) {
	return {
		date: row.day, // day is already a string in YYYY-MM-DD format
		validClicks: row.validClicks,
		invalidClicks: row.invalidClicks,
	};
}

const router = new Hono<AuthenticatedVariables & { Bindings: CloudflareBindings }>();

router.use("*", authMiddleware);

router.get("/:hireId/analytics", requireAuth, async (c) => {
	const hireId = c.req.param("hireId");
	const user = c.get("user");

	const parsedParams = analyticsParamsSchema.safeParse({
		range: c.req.query("range") ?? undefined,
		startDate: c.req.query("startDate") ?? undefined,
		endDate: c.req.query("endDate") ?? undefined,
	});

	if (!parsedParams.success) {
		return c.json({ error: "Invalid query parameters" }, 400);
	}

	const { startDate, endDate } = resolveDateRange(parsedParams.data);
	const startDateForDb = toDateAtStartOfDayUTC(startDate);
	const endDateForDb = toDateAtEndOfDayUTC(endDate);

	const [hireRow] = await db
		.select({ hire: hires, listing: listings, domain: domains })
		.from(hires)
		.leftJoin(listings, eq(hires.listingId, listings.id))
		.leftJoin(domains, eq(listings.domainId, domains.id))
		.where(eq(hires.id, hireId))
		.limit(1);

	if (!hireRow) {
		return c.json({ error: "Hire not found" }, 404);
	}

	if (!user || hireRow.hire.hirerId !== user.id) {
		return c.json({ error: "Forbidden" }, 403);
	}

	// Convert Date objects to YYYY-MM-DD strings for database comparison
	const startDateStr = toIsoDate(startDateForDb);
	const endDateStr = toIsoDate(endDateForDb);

	const rollupRows = await db
		.select()
		.from(clickRollups)
		.where(
			and(
				eq(clickRollups.hireId, hireId),
				gte(clickRollups.day, startDateStr),
				lte(clickRollups.day, endDateStr),
			),
		)
		.orderBy(desc(clickRollups.day));

	const summary = toSummary(rollupRows);
	const totalClicks = summary.validClicks + summary.invalidClicks;

	let timeSeries = rollupRows.map(toCamelCaseDate).reverse();

	const [{ geo }, { referrer }, { bot }, series] = await Promise.all([
		queryGeoBreakdown(c.env, hireId, startDate, endDate).then((data) => ({
			geo: data,
		})),
		queryReferrerBreakdown(c.env, hireId, startDate, endDate).then((data) => ({
			referrer: data,
		})),
		queryBotBreakdown(c.env, hireId, startDate, endDate).then((data) => ({
			bot: data,
		})),
		queryTimeSeriesData(c.env, hireId, startDate, endDate),
	]);

	if (series.length > 0) {
		timeSeries = series.map((row) => ({
			date: row.date.split("T")[0] || row.date,
			validClicks: row.validClicks,
			invalidClicks: row.invalidClicks,
		}));
	}

	return c.json({
		summary: {
			validClicks: summary.validClicks,
			invalidClicks: summary.invalidClicks,
			totalClicks,
		},
		timeSeries,
		breakdowns: {
			geo,
			referrer,
			bot,
		},
	});
});

export default router;

function isValidDateString(value: string): boolean {
	if (!DATE_REGEX.test(value)) {
		return false;
	}
	const parsed = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) {
		return false;
	}
	return toIsoDate(parsed) === value;
}

function toIsoDate(date: Date): string {
	const isoString = date.toISOString().split("T")[0];
	if (!isoString) {
		throw new Error("Invalid date conversion");
	}
	return isoString;
}

function toDateAtStartOfDayUTC(value: string): Date {
	const date = new Date(`${value}T00:00:00Z`);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date value: ${value}`);
	}
	return date;
}

function toDateAtEndOfDayUTC(value: string): Date {
	const date = toDateAtStartOfDayUTC(value);
	date.setUTCHours(23, 59, 59, 999);
	return date;
}


