"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { getListings, getDomains, getHires, getPayouts } from "@/lib/api-client";
import { MetricCard } from "@/components/analytics/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Globe,
	FileText,
	DollarSign,
	TrendingUp,
	Activity,
	Plus,
	ArrowRight,
	CheckCircle2,
	AlertCircle,
	Clock,
	RefreshCw,
} from "lucide-react";

export default function HostDashboardPage() {
	const { user } = useUser();

	// Fetch data
	const { data: listings, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useQuery({
		queryKey: ["listings"],
		queryFn: getListings,
	});

	const { data: domains, isLoading: domainsLoading, error: domainsError, refetch: refetchDomains } = useQuery({
		queryKey: ["domains"],
		queryFn: getDomains,
	});

	const { data: hires, isLoading: hiresLoading, error: hiresError, refetch: refetchHires } = useQuery({
		queryKey: ["hires"],
		queryFn: getHires,
	});

	const { data: payouts, isLoading: payoutsLoading, error: payoutsError, refetch: refetchPayouts } = useQuery({
		queryKey: ["payouts"],
		queryFn: getPayouts,
	});

	// Calculate metrics
	const totalDomains = domains?.length || 0;
	const verifiedDomains = domains?.filter((d) => d.verificationStatus === "verified").length || 0;
	const activeListings = listings?.filter((l) => l.status === "active").length || 0;
	const pausedListings = listings?.filter((l) => l.status === "paused").length || 0;
	const draftListings = listings?.filter((l) => l.status === "draft").length || 0;
	const activeHires = hires?.filter((r) => r.status === "active").length || 0;
	const totalEarnings = payouts?.reduce((sum, p) => sum + (p.amountCents || 0), 0) || 0;
	const totalEarningsDollars = totalEarnings / 100;

	const isLoading = listingsLoading || domainsLoading || hiresLoading || payoutsLoading;

	// Combine recent activities with timestamp validation
	const recentActivities = [];

	// Helper to validate and normalize timestamp
	const getValidTimestamp = (timestamp: string | undefined | null): string => {
		if (!timestamp) return new Date().toISOString();
		try {
			const date = new Date(timestamp);
			if (isNaN(date.getTime())) {
				return new Date().toISOString();
			}
			return timestamp;
		} catch {
			return new Date().toISOString();
		}
	};

	// Add domain activities
	if (domains) {
		domains.slice(0, 5).forEach((domain) => {
			if (domain.verificationStatus === "verified") {
				recentActivities.push({
					type: "domain_verified",
					icon: CheckCircle2,
					iconColor: "text-primary",
					description: `Domain ${domain.fqdn} verified`,
					timestamp: getValidTimestamp(domain.verifiedAt || domain.createdAt),
					badge: { text: "Verified", variant: "default" as const },
				});
			} else if (domain.verificationStatus === "pending") {
				recentActivities.push({
					type: "domain_pending",
					icon: Clock,
					iconColor: "text-secondary",
					description: `Domain ${domain.fqdn} pending verification`,
					timestamp: getValidTimestamp(domain.createdAt),
					badge: { text: "Pending", variant: "secondary" as const },
				});
			} else if (domain.verificationStatus === "failed") {
				recentActivities.push({
					type: "domain_failed",
					icon: AlertCircle,
					iconColor: "text-destructive",
					description: `Domain ${domain.fqdn} verification failed`,
					timestamp: getValidTimestamp(domain.createdAt),
					badge: { text: "Failed", variant: "destructive" as const },
				});
			}
		});
	}

	// Add listing activities
	if (listings) {
		listings.slice(0, 5).forEach((listing) => {
			recentActivities.push({
				type: "listing_created",
				icon: FileText,
				iconColor: "text-primary",
				description: `Listing created for ${listing.domain?.fqdn || "domain"}`,
				timestamp: getValidTimestamp(listing.createdAt),
				badge: { text: listing.status, variant: listing.status === "active" ? ("default" as const) : ("secondary" as const) },
			});
		});
	}

	// Add hire activities
	if (hires) {
		hires.slice(0, 5).forEach((hire) => {
			recentActivities.push({
				type: "hire_started",
				icon: Activity,
				iconColor: "text-primary",
				description: `New hire started`,
				timestamp: getValidTimestamp(hire.createdAt),
				badge: { text: hire.status, variant: "default" as const },
			});
		});
	}

	// Add payout activities
	if (payouts) {
		payouts.slice(0, 5).forEach((payout) => {
			recentActivities.push({
				type: "payout_received",
				icon: DollarSign,
				iconColor: "text-primary",
				description: `Payout received: $${((payout.amountCents || 0) / 100).toFixed(2)}`,
				timestamp: getValidTimestamp(payout.createdAt),
				badge: { text: payout.status, variant: payout.status === "paid" ? ("default" as const) : ("secondary" as const) },
			});
		});
	}

	// Sort by timestamp and limit to 10
	recentActivities.sort((a, b) => {
		try {
			return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
		} catch {
			return 0;
		}
	});
	const limitedActivities = recentActivities.slice(0, 10);

	// Format relative time with error handling
	const formatRelativeTime = (timestamp: string) => {
		try {
			const now = new Date();
			const then = new Date(timestamp);

			if (isNaN(then.getTime())) {
				return "Recently";
			}

			const diffMs = now.getTime() - then.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 1) return "Just now";
			if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
			if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
			return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
		} catch {
			return "Recently";
		}
	};

	const hasError = listingsError || domainsError || hiresError || payoutsError;

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Error Handling */}
			{hasError && (
				<Alert variant="destructive" className="mb-8">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Failed to load some data. Please try again.</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (listingsError) refetchListings();
									if (domainsError) refetchDomains();
									if (hiresError) refetchHires();
									if (payoutsError) refetchPayouts();
								}}
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Retry
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Owner Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Here's an overview of your domain listings and earnings.
				</p>
			</div>

			{/* Metric Cards */}
			<div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				{isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : (
					<>
						<MetricCard
							title="Total Domains"
							value={totalDomains}
							icon={<Globe className="h-5 w-5 text-primary" />}
							description={verifiedDomains > 0 ? `${verifiedDomains} verified` : undefined}
						/>
						<MetricCard
							title="Active Listings"
							value={activeListings}
							icon={<FileText className="h-5 w-5 text-primary" />}
							description={pausedListings > 0 || draftListings > 0 ? `${pausedListings} paused, ${draftListings} draft` : undefined}
						/>
						<MetricCard
							title="Active Hires"
							value={activeHires}
							icon={<Activity className="h-5 w-5 text-primary" />}
							description="Generating revenue"
						/>
						<MetricCard
							title="Total Earnings"
							value={`$${totalEarningsDollars.toFixed(2)}`}
							icon={<DollarSign className="h-5 w-5 text-primary" />}
							trend={totalEarnings > 0 ? "up" : undefined}
							description="All time"
						/>
					</>
				)}
			</div>

			{/* Quick Actions */}
			<div className="mb-8">
				<h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
				<div className="grid gap-4 md:grid-cols-3">
					<Link href="/host/domains">
						<Card className="group cursor-pointer transition-colors hover:border-primary">
							<CardHeader>
								<div className="flex items-center justify-between">
									<Globe className="h-8 w-8 text-primary" />
									<ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
								</div>
							</CardHeader>
							<CardContent>
								<h3 className="mb-2 font-semibold">Add Domain</h3>
								<p className="text-sm text-muted-foreground">
									Add and verify a new domain to expand your listings
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href="/host/listings">
						<Card className="group cursor-pointer transition-colors hover:border-primary">
							<CardHeader>
								<div className="flex items-center justify-between">
									<FileText className="h-8 w-8 text-primary" />
									<ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
								</div>
							</CardHeader>
							<CardContent>
								<h3 className="mb-2 font-semibold">Create Listing</h3>
								<p className="text-sm text-muted-foreground">
									List a verified domain and start earning
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href="/host/earnings">
						<Card className="group cursor-pointer transition-colors hover:border-primary">
							<CardHeader>
								<div className="flex items-center justify-between">
									<DollarSign className="h-8 w-8 text-primary" />
									<ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
								</div>
							</CardHeader>
							<CardContent>
								<h3 className="mb-2 font-semibold">View Earnings</h3>
								<p className="text-sm text-muted-foreground">
									Track your revenue and payout history
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</div>

			{/* Recent Activity */}
			<div className="mb-8">
				<h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
				<Card>
					<CardContent className="pt-6">
						{limitedActivities.length === 0 ? (
							<div className="py-8 text-center">
								<Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
								<p className="text-muted-foreground">
									No recent activity. Get started by adding a domain.
								</p>
								<Link href="/host/domains">
									<Button className="mt-4" variant="default">
										<Plus className="mr-2 h-4 w-4" />
										Add Domain
									</Button>
								</Link>
							</div>
						) : (
							<div className="space-y-4">
								{limitedActivities.map((activity, index) => {
									const Icon = activity.icon;
									return (
										<div key={index} className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0">
											<Icon className={`h-5 w-5 ${activity.iconColor}`} />
											<div className="flex-1">
												<p className="text-sm">{activity.description}</p>
												<p className="text-xs text-muted-foreground">
													{formatRelativeTime(activity.timestamp)}
												</p>
											</div>
											<Badge variant={activity.badge.variant}>{activity.badge.text}</Badge>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Empty State for No Domains */}
			{!isLoading && totalDomains === 0 && (
				<Alert className="border-primary/20 bg-primary/5">
					<Globe className="h-4 w-4 text-primary" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Get started by adding your first domain to begin listing and earning.</span>
							<Link href="/host/domains">
								<Button variant="default" size="sm">
									<Plus className="mr-2 h-4 w-4" />
									Add Domain
								</Button>
							</Link>
						</div>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}

