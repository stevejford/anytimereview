"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getHires, type Hire } from "@/lib/api-client";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import EmptyState from "@/components/empty-state";
import {
	FileText,
	Globe,
	Activity,
	TrendingUp,
	Calendar,
	Settings,
	BarChart3,
	AlertCircle,
	DollarSign,
	LogIn,
} from "lucide-react";

export default function HiresPage() {
	const { isSignedIn, isLoaded } = useUser();
	const [statusFilter, setStatusFilter] = React.useState("all");

	// Show sign-in prompt if not authenticated
	if (isLoaded && !isSignedIn) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<Breadcrumbs />
				<div className="mt-12">
					<EmptyState
						icon={<LogIn className="text-primary" />}
						title="Sign in to view your hires"
						description="You need to be signed in to view and manage your domain hires. Sign in or create an account to get started."
						action={{
							label: "Sign In",
							onClick: () => (window.location.href = "/sign-in"),
						}}
					/>
				</div>
			</div>
		);
	}

	// Fetch hires
	const {
		data: hires,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["hires", statusFilter],
		queryFn: () =>
			statusFilter === "all" ? getHires() : getHires({ status: statusFilter }),
	});

	// Calculate counts
	const counts = React.useMemo(() => {
		if (!hires) return { active: 0, ended: 0, suspended: 0, total: 0 };
		return {
			active: hires.filter((h) => h.status === "active").length,
			ended: hires.filter((h) => h.status === "ended").length,
			suspended: hires.filter((h) => h.status === "suspended").length,
			total: hires.length,
		};
	}, [hires]);

	// Calculate metrics
	const metrics = React.useMemo(() => {
		if (!hires) return { totalClicks: 0, monthlySpending: 0 };
		const totalClicks = hires.reduce((sum, h) => sum + (h.totalClicks || 0), 0);
		// Simplified monthly spending calculation
		const monthlySpending = hires
			.filter((h) => h.status === "active")
			.reduce((sum, h) => {
				if (h.type === "period" && h.listing?.pricePeriodCents) {
					return sum + h.listing.pricePeriodCents / 100;
				}
				return sum;
			}, 0);
		return { totalClicks, monthlySpending };
	}, [hires]);

	// Calculate time remaining for active hires
	const getTimeRemaining = (endAt: string | null) => {
		if (!endAt) return "Active";
		const end = new Date(endAt);
		const now = new Date();
		const diff = end.getTime() - now.getTime();
		if (diff <= 0) return "Expired";
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return "Less than 1 day";
		return `${days} day${days === 1 ? "" : "s"} left`;
	};

	// Filter upcoming renewals (ending in next 7 days)
	const upcomingRenewals = React.useMemo(() => {
		if (!hires) return [];
		const now = new Date();
		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		return hires.filter((h) => {
			if (h.status !== "active" || !h.endAt) return false;
			const endDate = new Date(h.endAt);
			return endDate > now && endDate <= sevenDaysFromNow;
		});
	}, [hires]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />

			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold">My Hires</h1>
						<p className="text-muted-foreground">
							Manage your active domain hires and track performance
						</p>
					</div>
					<Button asChild variant="outline">
						<Link href="/browse">Browse Domains</Link>
					</Button>
				</div>

				{/* Error State */}
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Unable to load hires. Please try again.
							<Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{/* Summary Cards */}
				{!isLoading && hires && hires.length > 0 && (
					<div className="grid gap-6 md:grid-cols-3">
						<Card>
							<CardContent className="pt-6 text-center">
								<Activity className="mx-auto mb-2 h-8 w-8 text-primary" />
								<p className="mb-1 text-3xl font-bold text-primary">{counts.active}</p>
								<p className="text-sm text-muted-foreground">Active Hires</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6 text-center">
								<BarChart3 className="mx-auto mb-2 h-8 w-8 text-primary" />
								<p className="mb-1 text-3xl font-bold text-primary">
									{metrics.totalClicks.toLocaleString()}
								</p>
								<p className="text-sm text-muted-foreground">Total Clicks</p>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="pt-6 text-center">
								<DollarSign className="mx-auto mb-2 h-8 w-8 text-secondary" />
								<p className="mb-1 text-3xl font-bold text-secondary">
									${metrics.monthlySpending.toFixed(2)}
								</p>
								<p className="text-sm text-muted-foreground">This Month</p>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Upcoming Renewals */}
				{upcomingRenewals.length > 0 && (
					<Card className="border-secondary bg-secondary/10">
						<CardHeader>
							<div className="flex items-center gap-2">
								<Calendar className="h-5 w-5 text-secondary" />
								<CardTitle className="text-lg">Upcoming Renewals</CardTitle>
							</div>
							<CardDescription>
								{upcomingRenewals.length} hire{upcomingRenewals.length === 1 ? "" : "s"} ending in the next 7 days
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{upcomingRenewals.map((hire) => (
									<div
										key={hire.id}
										className="flex items-center justify-between rounded-lg border bg-background p-3"
									>
										<div className="flex-1">
											<p className="font-medium">{hire.listing?.domain?.fqdn || "Unknown Domain"}</p>
											<p className="text-sm text-muted-foreground">
												Ends {hire.endAt ? new Date(hire.endAt).toLocaleDateString() : "Unknown"}
											</p>
										</div>
										<Button asChild size="sm" variant="secondary">
											<Link href={`/dashboard/hires/${hire.id}`}>
												Extend Now
											</Link>
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Status Tabs */}
				<Tabs value={statusFilter} onValueChange={setStatusFilter}>
					<TabsList>
						<TabsTrigger value="all">
							All Hires
							{counts.total > 0 && (
								<Badge variant="secondary" className="ml-2">
									{counts.total}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="active">
							Active
							{counts.active > 0 && (
								<Badge className="ml-2">{counts.active}</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="ended">
							Ended
							{counts.ended > 0 && (
								<Badge variant="outline" className="ml-2">
									{counts.ended}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value="suspended">
							Suspended
							{counts.suspended > 0 && (
								<Badge variant="destructive" className="ml-2">
									{counts.suspended}
								</Badge>
							)}
						</TabsTrigger>
					</TabsList>

					<TabsContent value={statusFilter} className="mt-6">
						{/* Loading State */}
						{isLoading && (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{[...Array(3)].map((_, i) => (
									<Card key={i}>
										<CardHeader>
											<Skeleton className="h-6 w-3/4" />
										</CardHeader>
										<CardContent>
											<Skeleton className="mb-2 h-4 w-1/2" />
											<Skeleton className="h-4 w-2/3" />
										</CardContent>
										<CardFooter>
											<Skeleton className="h-10 w-full" />
										</CardFooter>
									</Card>
								))}
							</div>
						)}

						{/* Empty State */}
						{!isLoading && (!hires || hires.length === 0) && (
							<EmptyState
								icon={<FileText className="text-primary" />}
								title="No hires yet"
								description="You haven't hired any domains yet. Browse our marketplace to find the perfect domain for your campaign."
								action={{
									label: "Browse Domains",
									onClick: () => (window.location.href = "/browse"),
								}}
							/>
						)}

						{/* Hires Grid */}
						{!isLoading && hires && hires.length > 0 && (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{hires.map((hire) => (
									<Card
										key={hire.id}
										className="group flex flex-col justify-between transition-all duration-200 hover:border-primary hover:shadow-lg"
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													<Globe className="h-5 w-5 text-primary" />
													<CardTitle className="text-lg">
														{hire.listing?.domain?.fqdn || "Unknown Domain"}
													</CardTitle>
												</div>
												<Badge
													variant={
														hire.status === "active"
															? "default"
															: hire.status === "suspended"
															? "destructive"
															: "secondary"
													}
													className="gap-1"
												>
													{hire.status === "active" && <Activity className="h-3 w-3" />}
													{hire.status === "suspended" && <AlertCircle className="h-3 w-3" />}
													{hire.status === "ended" && <Calendar className="h-3 w-3" />}
													{hire.status.charAt(0).toUpperCase() + hire.status.slice(1)}
												</Badge>
											</div>
											<Badge variant="secondary" className="w-fit">
												{hire.type === "period" ? "Monthly" : "Per Click"}
											</Badge>
										</CardHeader>

										<CardContent className="space-y-3">
											<div className="space-y-1 text-sm">
												<div className="flex items-center gap-2 text-muted-foreground">
													<Calendar className="h-4 w-4" />
													<span>Started {new Date(hire.startAt).toLocaleDateString()}</span>
												</div>
												{hire.status === "active" && (
													<p className="text-primary font-medium">
														{getTimeRemaining(hire.endAt)}
													</p>
												)}
												{hire.status === "ended" && hire.endAt && (
													<p className="text-muted-foreground">
														Ended {new Date(hire.endAt).toLocaleDateString()}
													</p>
												)}
											</div>

											{hire.totalClicks !== undefined && (
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="gap-1">
														<Activity className="h-3 w-3" />
														{hire.totalClicks.toLocaleString()} clicks
													</Badge>
												</div>
											)}

											<p className="text-xs text-muted-foreground">
												{hire.listing?.mode === "exclusive"
													? "Exclusive access"
													: "Shared slugs"}
											</p>
										</CardContent>

										<CardFooter className="flex gap-2">
											<Button asChild size="sm" variant="outline">
												<Link href={`/dashboard/hires/${hire.id}/routes`}>
													Manage Routes
												</Link>
											</Button>
											<Button asChild size="sm" className="flex-1">
												<Link href={`/dashboard/hires/${hire.id}/analytics`}>
													<BarChart3 className="mr-2 h-4 w-4" />
													View Analytics
												</Link>
											</Button>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="outline" size="sm">
														<Settings className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link href={`/dashboard/hires/${hire.id}`}>
															View Details
														</Link>
													</DropdownMenuItem>
													{hire.status === "active" && (
														<>
															<DropdownMenuItem>Extend Hire</DropdownMenuItem>
															<DropdownMenuItem className="text-destructive">
																Cancel Hire
															</DropdownMenuItem>
														</>
													)}
												</DropdownMenuContent>
											</DropdownMenu>
										</CardFooter>
									</Card>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

