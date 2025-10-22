"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Activity } from "lucide-react";

import {
	getRental,
	getRentalAnalytics,
	type AnalyticsResponse,
	type Rental,
} from "@/lib/api-client";
import { DateRangePicker, type DateRange } from "@/components/analytics/date-range-picker";
import { MetricCard } from "@/components/analytics/metric-card";
import { TimeSeriesChart } from "@/components/analytics/time-series-chart";
import { BreakdownChart } from "@/components/analytics/breakdown-chart";
import { CsvExportButton } from "@/components/analytics/csv-export-button";
import { DataTable } from "@/components/listings/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";

const PRESET_RANGES: Array<{ label: string; value: Required<DateRange> }> = [
	{
		label: "Last 7 days",
		value: {
			from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
	{
		label: "Last 30 days",
		value: {
			from: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
	{
		label: "Last 90 days",
		value: {
			from: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
			to: new Date(),
		},
	},
];

function toIsoDate(date: Date | undefined) {
	if (!date) return undefined;
	return date.toISOString().split("T")[0];
}

function calculateInvalidRate(summary: AnalyticsResponse["summary"]) {
	if (summary.totalClicks === 0) return 0;
	return (summary.invalidClicks / summary.totalClicks) * 100;
}

function buildCsvData(analytics: AnalyticsResponse) {
	const seriesRows = analytics.timeSeries.map((row) => ({
		type: "timeseries",
		date: row.date,
		validClicks: row.validClicks,
		invalidClicks: row.invalidClicks,
		segment: "",
		clicks: "",
	}));

	const geoRows = analytics.breakdowns.geo.map((row) => ({
		type: "geo",
		date: "",
		validClicks: "",
		invalidClicks: "",
		segment: row.country,
		clicks: row.clicks,
	}));

	const referrerRows = analytics.breakdowns.referrer.map((row) => ({
		type: "referrer",
		date: "",
		validClicks: "",
		invalidClicks: "",
		segment: row.referrer,
		clicks: row.clicks,
	}));

	const botRows = analytics.breakdowns.bot.map((row) => ({
		type: "bot",
		date: "",
		validClicks: "",
		invalidClicks: "",
		segment: row.botBucket,
		clicks: row.clicks,
	}));

	return [...seriesRows, ...geoRows, ...referrerRows, ...botRows];
}

type BreakdownRow = {
	segment: string;
	clicks: number;
};

const breakdownColumns: ColumnDef<BreakdownRow>[] = [
	{
		accessorKey: "segment",
		header: "Segment",
		cell: ({ getValue }) => <span className="truncate font-medium">{getValue<string>()}</span>,
	},
	{
		accessorKey: "clicks",
		header: "Clicks",
		cell: ({ getValue }) => <span className="tabular-nums">{getValue<number>().toLocaleString()}</span>,
	},
];

function mapGeoBreakdown(analytics: AnalyticsResponse): BreakdownRow[] {
	return analytics.breakdowns.geo.map((row) => ({
		segment: row.country || "Unknown",
		clicks: row.clicks,
	}));
}

function mapReferrerBreakdown(analytics: AnalyticsResponse): BreakdownRow[] {
	return analytics.breakdowns.referrer.map((row) => ({
		segment: row.referrer || "Direct",
		clicks: row.clicks,
	}));
}

function mapBotBreakdown(analytics: AnalyticsResponse): BreakdownRow[] {
	return analytics.breakdowns.bot.map((row) => ({
		segment: row.botBucket || "Unknown",
		clicks: row.clicks,
	}));
}

export default function RentalAnalyticsPage() {
	const params = useParams();
	const rentalId = params?.id as string | undefined;
	const [dateRange, setDateRange] = useState<DateRange>({
		from: PRESET_RANGES[1].value.from,
		to: PRESET_RANGES[1].value.to,
	});
	const [activeTab, setActiveTab] = useState("geo");

	const rentalQuery = useQuery<Rental>({
		queryKey: ["rental", rentalId],
		queryFn: () => getRental(rentalId!),
		enabled: Boolean(rentalId),
	});

	const analyticsQuery = useQuery<AnalyticsResponse>({
		queryKey: [
			"rental-analytics",
			rentalId,
			dateRange.from?.toISOString(),
			dateRange.to?.toISOString(),
		],
		queryFn: () =>
			getRentalAnalytics(rentalId!, {
				startDate: toIsoDate(dateRange.from),
				endDate: toIsoDate(dateRange.to),
			}),
		enabled: Boolean(rentalId && dateRange.from && dateRange.to),
	});

	const rental = rentalQuery.data;
	const analytics = analyticsQuery.data;
	const invalidRate = useMemo(
		() => (analytics ? calculateInvalidRate(analytics.summary) : 0),
		[analytics],
	);

	const csvData = useMemo(
		() => (analytics ? buildCsvData(analytics) : []),
		[analytics],
	);

	const breakdownData = useMemo(() => {
		if (!analytics) return [];
		switch (activeTab) {
			case "geo":
				return mapGeoBreakdown(analytics);
			case "referrer":
				return mapReferrerBreakdown(analytics);
			case "bot":
				return mapBotBreakdown(analytics);
			default:
				return [];
		}
	}, [analytics, activeTab]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<Button variant="ghost" asChild>
						<Link href={`/dashboard/rentals/${rentalId}`}>
							<ArrowLeft className="mr-2 h-4 w-4" /> Back to rental
						</Link>
					</Button>
				<div className="flex flex-col gap-2 md:flex-row md:items-center">
					<div className="space-y-1">
						<h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
						{rental ? (
							<p className="text-sm text-muted-foreground">
								{rental.listing?.domain?.fqdn ?? rental.listingId}
							</p>
						) : null}
					</div>
					<DateRangePicker value={dateRange} onChange={setDateRange} presets={PRESET_RANGES} />
				</div>
			</div>

			{analyticsQuery.isLoading ? (
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-1/3" />
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</CardContent>
				</Card>
			) : null}

			{analyticsQuery.isError ? (
				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Unable to load analytics</AlertTitle>
					<AlertDescription>
						{analyticsQuery.error instanceof Error
								? analyticsQuery.error.message
								: "We couldn't load analytics for this rental. Please try again later."}
					</AlertDescription>
				</Alert>
			) : null}

			{analytics ? (
				<section className="space-y-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<MetricCard
							title="Total Clicks"
							value={analytics.summary.totalClicks}
							icon={<Activity className="h-4 w-4" />}
						/>
						<MetricCard
							title="Valid Clicks"
							value={analytics.summary.validClicks}
						/>
				<MetricCard
					title="Invalid Clicks"
					value={analytics.summary.invalidClicks}
					trend="down"
					badge={{ label: "IVT policy", variant: "outline" }}
				/>
				<MetricCard
					title="Invalid Rate"
					value={`${invalidRate.toFixed(1)}%`}
					badge={{ label: "IVT indicator", variant: "outline" }}
				/>
					</div>

					<TimeSeriesChart
						title="Daily Clicks"
						description="Valid vs invalid clicks over time"
						data={analytics.timeSeries}
					/>

					<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
						<TabsList>
							<TabsTrigger value="geo">Geo</TabsTrigger>
							<TabsTrigger value="referrer">Referrer</TabsTrigger>
							<TabsTrigger value="bot">Bot Classification</TabsTrigger>
						</TabsList>
						<TabsContent value="geo">
						<BreakdownChart
							title="Clicks by Country"
							description="Top sources of traffic by country"
							data={mapGeoBreakdown(analytics).map((row) => ({
								name: row.segment,
								value: row.clicks,
							}))}
						/>
						<div className="mt-6">
							<DataTable
								data={breakdownData}
								columns={breakdownColumns}
								emptyMessage="No geo data"
								searchPlaceholder="Filter countries..."
							/>
						</div>
						</TabsContent>
						<TabsContent value="referrer">
						<BreakdownChart
							title="Clicks by Referrer"
							description="Referring domains driving traffic"
							data={mapReferrerBreakdown(analytics).map((row) => ({
								name: row.segment,
								value: row.clicks,
							}))}
						/>
						<div className="mt-6">
							<DataTable
								data={breakdownData}
								columns={breakdownColumns}
								emptyMessage="No referrer data"
								searchPlaceholder="Filter referrers..."
							/>
						</div>
						</TabsContent>
						<TabsContent value="bot">
						<BreakdownChart
							title="Bot Classification"
							description="Breakdown of clicks by bot detection bucket"
							data={mapBotBreakdown(analytics).map((row) => ({
								name: row.segment,
								value: row.clicks,
							}))}
						/>
						<div className="mt-6">
							<DataTable
								data={breakdownData}
								columns={breakdownColumns}
								emptyMessage="No bot data"
								searchPlaceholder="Filter bot buckets..."
							/>
						</div>
						</TabsContent>
					</Tabs>

					<Card>
						<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<CardTitle>Export Data</CardTitle>
								<CardDescription>
									Download the current date range as a CSV with breakdown details.
								</CardDescription>
							</div>
							<CsvExportButton
								filename={`rental-${rentalId}-analytics.csv`}
								data={csvData}
								columns={[
									{ key: "type", label: "type" },
									{ key: "date", label: "date" },
									{ key: "validClicks", label: "validClicks" },
									{ key: "invalidClicks", label: "invalidClicks" },
									{ key: "segment", label: "segment" },
									{ key: "clicks", label: "clicks" },
								]}
							/>
						</CardHeader>
					</Card>
				</section>
			) : null}

			{!analytics && !analyticsQuery.isLoading && !analyticsQuery.isError ? (
				<Card>
					<CardHeader>
						<CardTitle>No analytics available</CardTitle>
						<CardDescription>
							No click data has been recorded for this rental within the selected range.
						</CardDescription>
					</CardHeader>
				</Card>
			) : null}

			{rental ? (
				<Card>
					<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Rental summary</CardTitle>
							<CardDescription>
								Renter analytics for {rental.listing?.domain?.fqdn ?? rental.listingId}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="capitalize">
								{rental.type === "period" ? "Monthly" : "Per click"}
							</Badge>
							<Badge className="capitalize">{rental.status}</Badge>
						</div>
					</CardHeader>
				</Card>
			) : null}
			</div>
		</div>
	);
}


