"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getRentals, type Rental } from "@/lib/api-client";
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

export default function RentalsPage() {
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
						title="Sign in to view your rentals"
						description="You need to be signed in to view and manage your domain rentals. Sign in or create an account to get started."
						action={{
							label: "Sign In",
							onClick: () => (window.location.href = "/sign-in"),
						}}
					/>
				</div>
			</div>
		);
	}

	// Fetch rentals
	const {
		data: rentals,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["rentals", statusFilter],
		queryFn: () =>
			statusFilter === "all" ? getRentals() : getRentals({ status: statusFilter }),
	});

	// Calculate counts
	const counts = React.useMemo(() => {
		if (!rentals) return { active: 0, ended: 0, suspended: 0, total: 0 };
		return {
			active: rentals.filter((r) => r.status === "active").length,
			ended: rentals.filter((r) => r.status === "ended").length,
			suspended: rentals.filter((r) => r.status === "suspended").length,
			total: rentals.length,
		};
	}, [rentals]);

	// Calculate metrics
	const metrics = React.useMemo(() => {
		if (!rentals) return { totalClicks: 0, monthlySpending: 0 };
		const totalClicks = rentals.reduce((sum, r) => sum + (r.totalClicks || 0), 0);
		// Simplified monthly spending calculation
		const monthlySpending = rentals
			.filter((r) => r.status === "active")
			.reduce((sum, r) => {
				if (r.type === "period" && r.listing?.pricePeriodCents) {
					return sum + r.listing.pricePeriodCents / 100;
				}
				return sum;
			}, 0);
		return { totalClicks, monthlySpending };
	}, [rentals]);

	// Calculate time remaining for active rentals
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
		if (!rentals) return [];
		const now = new Date();
		const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		return rentals.filter((r) => {
			if (r.status !== "active" || !r.endAt) return false;
			const endDate = new Date(r.endAt);
			return endDate > now && endDate <= sevenDaysFromNow;
		});
	}, [rentals]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />

			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold">My Rentals</h1>
						<p className="text-muted-foreground">
							Manage your active domain rentals and track performance
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
							Unable to load rentals. Please try again.
							<Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">
								Retry
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{/* Summary Cards */}
				{!isLoading && rentals && rentals.length > 0 && (
					<div className="grid gap-6 md:grid-cols-3">
						<Card>
							<CardContent className="pt-6 text-center">
								<Activity className="mx-auto mb-2 h-8 w-8 text-primary" />
								<p className="mb-1 text-3xl font-bold text-primary">{counts.active}</p>
								<p className="text-sm text-muted-foreground">Active Rentals</p>
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
								{upcomingRenewals.length} rental{upcomingRenewals.length === 1 ? "" : "s"} ending in the next 7 days
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{upcomingRenewals.map((rental) => (
									<div
										key={rental.id}
										className="flex items-center justify-between rounded-lg border bg-background p-3"
									>
										<div className="flex-1">
											<p className="font-medium">{rental.listing?.domain?.fqdn || "Unknown Domain"}</p>
											<p className="text-sm text-muted-foreground">
												Ends {rental.endAt ? new Date(rental.endAt).toLocaleDateString() : "Unknown"}
											</p>
										</div>
										<Button asChild size="sm" variant="secondary">
											<Link href={`/dashboard/rentals/${rental.id}`}>
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
							All Rentals
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
						{!isLoading && (!rentals || rentals.length === 0) && (
							<EmptyState
								icon={<FileText className="text-primary" />}
								title="No rentals yet"
								description="You haven't rented any domains yet. Browse our marketplace to find the perfect domain for your campaign."
								action={{
									label: "Browse Domains",
									onClick: () => (window.location.href = "/browse"),
								}}
							/>
						)}

						{/* Trips Grid */}
						{!isLoading && rentals && rentals.length > 0 && (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{rentals.map((rental) => (
									<Card
										key={rental.id}
										className="group flex flex-col justify-between transition-all duration-200 hover:border-primary hover:shadow-lg"
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-2">
													<Globe className="h-5 w-5 text-primary" />
													<CardTitle className="text-lg">
														{rental.listing?.domain?.fqdn || "Unknown Domain"}
													</CardTitle>
												</div>
												<Badge
													variant={
														rental.status === "active"
															? "default"
															: rental.status === "suspended"
															? "destructive"
															: "secondary"
													}
													className="gap-1"
												>
													{rental.status === "active" && <Activity className="h-3 w-3" />}
													{rental.status === "suspended" && <AlertCircle className="h-3 w-3" />}
													{rental.status === "ended" && <Calendar className="h-3 w-3" />}
													{rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
												</Badge>
											</div>
											<Badge variant="secondary" className="w-fit">
												{rental.type === "period" ? "Monthly" : "Per Click"}
											</Badge>
										</CardHeader>

										<CardContent className="space-y-3">
											<div className="space-y-1 text-sm">
												<div className="flex items-center gap-2 text-muted-foreground">
													<Calendar className="h-4 w-4" />
													<span>Started {new Date(rental.startAt).toLocaleDateString()}</span>
												</div>
												{rental.status === "active" && (
													<p className="text-primary font-medium">
														{getTimeRemaining(rental.endAt)}
													</p>
												)}
												{rental.status === "ended" && rental.endAt && (
													<p className="text-muted-foreground">
														Ended {new Date(rental.endAt).toLocaleDateString()}
													</p>
												)}
											</div>

											{rental.totalClicks !== undefined && (
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="gap-1">
														<Activity className="h-3 w-3" />
														{rental.totalClicks.toLocaleString()} clicks
													</Badge>
												</div>
											)}

											<p className="text-xs text-muted-foreground">
												{rental.listing?.mode === "exclusive"
													? "Exclusive access"
													: "Shared slugs"}
											</p>
										</CardContent>

										<CardFooter className="flex gap-2">
											<Button asChild size="sm" variant="outline">
												<Link href={`/dashboard/rentals/${rental.id}/routes`}>
													Manage Routes
												</Link>
											</Button>
											<Button asChild size="sm" className="flex-1">
												<Link href={`/dashboard/rentals/${rental.id}/analytics`}>
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
														<Link href={`/dashboard/rentals/${rental.id}`}>
															View Details
														</Link>
													</DropdownMenuItem>
													{rental.status === "active" && (
														<>
															<DropdownMenuItem>Extend Rental</DropdownMenuItem>
															<DropdownMenuItem className="text-destructive">
																Cancel Rental
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

