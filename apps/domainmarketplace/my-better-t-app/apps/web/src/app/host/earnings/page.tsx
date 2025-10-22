"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPayouts, getConnectStatus, getHires } from "@/lib/api-client";
import { TimeSeriesChart } from "@/components/analytics/time-series-chart";
import { MetricCard } from "@/components/analytics/metric-card";
import { ConnectOnboardingDialog } from "@/components/billing/connect-onboarding-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DollarSign,
	TrendingUp,
	Calendar,
	Download,
	ExternalLink,
	AlertCircle,
	CheckCircle2,
	Clock,
	Copy,
	RefreshCw,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
} from "recharts";

export default function HostEarningsPage() {
	const [dateRange, setDateRange] = React.useState("30");
	const [isConnectDialogOpen, setIsConnectDialogOpen] = React.useState(false);
	const [statusFilter, setStatusFilter] = React.useState("all");
	const [sortBy, setSortBy] = React.useState("newest");
	const [currentPage, setCurrentPage] = React.useState(0);
	const [payoutStartDate, setPayoutStartDate] = React.useState<string>("");
	const [payoutEndDate, setPayoutEndDate] = React.useState<string>("");
	const pageSize = 20;

	// Fetch data
	const { data: payouts, isLoading: payoutsLoading, error: payoutsError, refetch: refetchPayouts } = useQuery({
		queryKey: ["payouts"],
		queryFn: getPayouts,
	});

	const { data: connectStatus, isLoading: connectLoading, error: connectError, refetch: refetchConnect } = useQuery({
		queryKey: ["connectStatus"],
		queryFn: getConnectStatus,
	});

	const { data: hires, isLoading: hiresLoading } = useQuery({
		queryKey: ["hires"],
		queryFn: getHires,
	});

	// Calculate metrics
	const totalEarnings = payouts?.reduce((sum, p) => sum + (p.amountCents || 0), 0) || 0;
	const totalEarningsDollars = totalEarnings / 100;

	// Calculate this month's earnings
	const now = new Date();
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const thisMonthPayouts = payouts?.filter(
		(p) => new Date(p.createdAt) >= thisMonthStart
	) || [];
	const thisMonthEarnings = thisMonthPayouts.reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100;

	// Calculate last month's earnings for comparison
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
	const lastMonthPayouts = payouts?.filter(
		(p) => {
			const date = new Date(p.createdAt);
			return date >= lastMonthStart && date <= lastMonthEnd;
		}
	) || [];
	const lastMonthEarnings = lastMonthPayouts.reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100;

	// Calculate trend
	const monthTrend = lastMonthEarnings > 0
		? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
		: 0;

	// Pending payouts
	const pendingPayouts = payouts?.filter((p) => p.status === "pending") || [];
	const pendingAmount = pendingPayouts.reduce((sum, p) => sum + (p.amountCents || 0), 0) / 100;

	// Average payout
	const averagePayout = payouts && payouts.length > 0
		? totalEarningsDollars / payouts.length
		: 0;

	// Earnings breakdown by listing
	const earningsByListing = React.useMemo(() => {
		if (!hires || !payouts) return [];

		const listingMap = new Map<string, { name: string; revenue: number; activeHires: number }>();

		hires.forEach((hire) => {
			const listingId = hire.listingId;
			const listingName = hire.listing?.domain?.fqdn || `Listing ${listingId}`;

			if (!listingMap.has(listingId)) {
				listingMap.set(listingId, { name: listingName, revenue: 0, activeHires: 0 });
			}

			const entry = listingMap.get(listingId)!;
			if (hire.status === "active") {
				entry.activeHires++;
			}
			// Add revenue from hire
			if (hire.totalPaidCents) {
				entry.revenue += hire.totalPaidCents / 100;
			}
		});

		const result = Array.from(listingMap.values()).map((item) => ({
			...item,
			percentage: totalEarningsDollars > 0 ? (item.revenue / totalEarningsDollars) * 100 : 0,
		}));

		return result.sort((a, b) => b.revenue - a.revenue);
	}, [hires, payouts, totalEarningsDollars]);

	// Filter and sort payouts
	const filteredAndSortedPayouts = React.useMemo(() => {
		if (!payouts) return [];

		let filtered = payouts;

		// Filter by status
		if (statusFilter !== "all") {
			filtered = filtered.filter((p) => p.status === statusFilter);
		}

		// Filter by date range
		if (payoutStartDate) {
			const startDate = new Date(payoutStartDate);
			filtered = filtered.filter((p) => new Date(p.createdAt) >= startDate);
		}
		if (payoutEndDate) {
			const endDate = new Date(payoutEndDate);
			endDate.setHours(23, 59, 59, 999); // Include the entire end date
			filtered = filtered.filter((p) => new Date(p.createdAt) <= endDate);
		}

		// Sort
		filtered = [...filtered].sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			} else if (sortBy === "oldest") {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			} else if (sortBy === "highest") {
				return (b.amountCents || 0) - (a.amountCents || 0);
			} else if (sortBy === "lowest") {
				return (a.amountCents || 0) - (b.amountCents || 0);
			}
			return 0;
		});

		return filtered;
	}, [payouts, statusFilter, sortBy, payoutStartDate, payoutEndDate]);

	// Reset page when filters change
	React.useEffect(() => {
		setCurrentPage(0);
	}, [statusFilter, sortBy, payoutStartDate, payoutEndDate]);

	// Paginate payouts
	const paginatedPayouts = React.useMemo(() => {
		const start = currentPage * pageSize;
		const end = start + pageSize;
		return filteredAndSortedPayouts.slice(start, end);
	}, [filteredAndSortedPayouts, currentPage]);

	const totalPages = Math.ceil(filteredAndSortedPayouts.length / pageSize);

	// Prepare chart data
	const chartData = React.useMemo(() => {
		if (!payouts) return [];

		const days = parseInt(dateRange);
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Group payouts by date
		const grouped = payouts.reduce((acc, payout) => {
			const date = new Date(payout.createdAt).toLocaleDateString();
			if (new Date(payout.createdAt) >= startDate) {
				if (!acc[date]) {
					acc[date] = 0;
				}
				acc[date] += (payout.amountCents || 0) / 100;
			}
			return acc;
		}, {} as Record<string, number>);

		return Object.entries(grouped).map(([date, amount]) => ({
			date,
			amount,
		}));
	}, [payouts, dateRange]);

	// Export CSV
	const exportCSV = () => {
		if (!filteredAndSortedPayouts) return;

		const headers = ["Date", "Amount", "Status", "Period", "Transfer ID"];
		const rows = filteredAndSortedPayouts.map((p) => [
			new Date(p.createdAt).toLocaleDateString(),
			`$${((p.amountCents || 0) / 100).toFixed(2)}`,
			p.status,
			p.periodStart && p.periodEnd
				? `${new Date(p.periodStart).toLocaleDateString()} - ${new Date(p.periodEnd).toLocaleDateString()}`
				: "N/A",
			p.stripeTransferId || "N/A",
		]);

		const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `earnings-${new Date().toISOString().split("T")[0]}.csv`;
		a.click();
		toast.success("CSV exported successfully");
	};

	// Copy to clipboard
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const isLoading = payoutsLoading || connectLoading || hiresLoading;

	const hasError = payoutsError || connectError;

	// Get Stripe dashboard URL
	const stripeDashboardUrl = connectStatus?.dashboardUrl ||
		(connectStatus?.accountId ? `https://dashboard.stripe.com/connect/accounts/${connectStatus.accountId}` : null);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Error Handling */}
			{hasError && (
				<Alert variant="destructive" className="mb-8">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Failed to load earnings data. Please try again.</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (payoutsError) refetchPayouts();
									if (connectError) refetchConnect();
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
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
					<p className="text-muted-foreground">
						Track your revenue, payouts, and financial performance
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={exportCSV}>
						<Download className="mr-2 h-4 w-4" />
						Export CSV
					</Button>
					{connectStatus?.onboardingComplete && stripeDashboardUrl && (
						<Button variant="outline" asChild>
							<a
								href={stripeDashboardUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								View Stripe Dashboard
							</a>
						</Button>
					)}
				</div>
			</div>

			{/* Stripe Connect Status */}
			{!connectStatus?.onboardingComplete ? (
				<Alert variant="destructive" className="mb-8">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Complete Stripe Connect setup to receive payouts</span>
							<Button
								variant="default"
								size="sm"
								onClick={() => setIsConnectDialogOpen(true)}
							>
								Setup Stripe Connect
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			) : (
				<Alert className="mb-8 border-primary/20 bg-primary/5">
					<CheckCircle2 className="h-4 w-4 text-primary" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<div>
								<span className="font-medium">Stripe Connect active</span>
								<span className="ml-2 text-sm text-muted-foreground">
									Account ID: {connectStatus.accountId}
								</span>
							</div>
						</div>
					</AlertDescription>
				</Alert>
			)}

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
							title="Total Earnings"
							value={`$${totalEarningsDollars.toFixed(2)}`}
							icon={<DollarSign className="h-5 w-5 text-primary" />}
							trend={totalEarnings > 0 ? "up" : undefined}
							description="All time"
						/>
						<MetricCard
							title="This Month"
							value={`$${thisMonthEarnings.toFixed(2)}`}
							icon={<Calendar className="h-5 w-5 text-primary" />}
							trend={monthTrend > 0 ? "up" : monthTrend < 0 ? "down" : undefined}
							trendValue={Math.abs(monthTrend).toFixed(1)}
							description={now.toLocaleDateString("en-US", { month: "long" })}
						/>
						<MetricCard
							title="Pending Payouts"
							value={`$${pendingAmount.toFixed(2)}`}
							icon={<Clock className="h-5 w-5 text-secondary" />}
							description="Processing"
						/>
						<MetricCard
							title="Average Payout"
							value={`$${averagePayout.toFixed(2)}`}
							icon={<TrendingUp className="h-5 w-5 text-primary" />}
							description="Per payout"
						/>
					</>
				)}
			</div>

			{/* Earnings Chart */}
			<Card className="mb-8">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Earnings Over Time</CardTitle>
						<Tabs value={dateRange} onValueChange={setDateRange}>
							<TabsList>
								<TabsTrigger value="7">Last 7 days</TabsTrigger>
								<TabsTrigger value="30">Last 30 days</TabsTrigger>
								<TabsTrigger value="90">Last 90 days</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</CardHeader>
				<CardContent>
					{chartData.length === 0 ? (
						<div className="py-16 text-center text-muted-foreground">
							No earnings data for this period
						</div>
					) : (
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="amount" fill="hsl(var(--primary))" name="Earnings ($)" />
							</BarChart>
						</ResponsiveContainer>
					)}
				</CardContent>
			</Card>

			{/* Earnings Breakdown */}
			{earningsByListing.length > 0 && (
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Earnings Breakdown by Listing</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid gap-6 md:grid-cols-2">
							{/* Pie Chart */}
							<div>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={earningsByListing.slice(0, 10)}
											dataKey="revenue"
											nameKey="name"
											cx="50%"
											cy="50%"
											outerRadius={100}
											label={(entry) => `${entry.name}: $${entry.revenue.toFixed(2)}`}
										>
											{earningsByListing.slice(0, 10).map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"}
												/>
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>

							{/* Table */}
							<div>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Listing</TableHead>
											<TableHead className="text-right">Revenue</TableHead>
											<TableHead className="text-right">%</TableHead>
											<TableHead className="text-right">Active</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{earningsByListing.slice(0, 10).map((item, index) => (
											<TableRow key={index}>
												<TableCell className="font-medium">{item.name}</TableCell>
												<TableCell className="text-right">${item.revenue.toFixed(2)}</TableCell>
												<TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
												<TableCell className="text-right">
													<Badge variant={item.activeHires > 0 ? "default" : "secondary"}>
														{item.activeHires}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Payout History */}
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4">
						<div className="flex items-center justify-between">
							<CardTitle>Payout History</CardTitle>
							<div className="flex gap-2">
								<Tabs value={statusFilter} onValueChange={setStatusFilter}>
									<TabsList>
										<TabsTrigger value="all">All</TabsTrigger>
										<TabsTrigger value="paid">Paid</TabsTrigger>
										<TabsTrigger value="pending">Pending</TabsTrigger>
										<TabsTrigger value="failed">Failed</TabsTrigger>
									</TabsList>
								</Tabs>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm">
											Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "highest" ? "Highest" : "Lowest"}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem onClick={() => setSortBy("newest")}>
											Newest first
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy("oldest")}>
											Oldest first
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy("highest")}>
											Highest amount
										</DropdownMenuItem>
										<DropdownMenuItem onClick={() => setSortBy("lowest")}>
											Lowest amount
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						{/* Date Range Filter */}
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium">From:</label>
								<input
									type="date"
									value={payoutStartDate}
									onChange={(e) => setPayoutStartDate(e.target.value)}
									className="rounded-md border border-input bg-background px-3 py-1 text-sm"
								/>
							</div>
							<div className="flex items-center gap-2">
								<label className="text-sm font-medium">To:</label>
								<input
									type="date"
									value={payoutEndDate}
									onChange={(e) => setPayoutEndDate(e.target.value)}
									className="rounded-md border border-input bg-background px-3 py-1 text-sm"
								/>
							</div>
							{(payoutStartDate || payoutEndDate) && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => {
										setPayoutStartDate("");
										setPayoutEndDate("");
									}}
								>
									Clear Dates
								</Button>
							)}
						</div>

						{/* Active Filters */}
						{(payoutStartDate || payoutEndDate) && (
							<div className="flex flex-wrap gap-2">
								{payoutStartDate && (
									<Badge variant="secondary" className="gap-1">
										From: {new Date(payoutStartDate).toLocaleDateString()}
										<button
											onClick={() => setPayoutStartDate("")}
											className="ml-1 hover:text-destructive"
										>
											×
										</button>
									</Badge>
								)}
								{payoutEndDate && (
									<Badge variant="secondary" className="gap-1">
										To: {new Date(payoutEndDate).toLocaleDateString()}
										<button
											onClick={() => setPayoutEndDate("")}
											className="ml-1 hover:text-destructive"
										>
											×
										</button>
									</Badge>
								)}
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{paginatedPayouts.length === 0 ? (
						<div className="py-16 text-center">
							<DollarSign className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<p className="text-muted-foreground">
								No payouts yet. Payouts are processed automatically when you earn revenue.
							</p>
							<p className="mt-2 text-sm text-muted-foreground">
								Minimum payout threshold: $10.00
							</p>
						</div>
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Date</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Transfer ID</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{paginatedPayouts.map((payout) => (
										<TableRow key={payout.id}>
											<TableCell>{formatDate(payout.createdAt)}</TableCell>
											<TableCell className="font-medium">
												${((payout.amountCents || 0) / 100).toFixed(2)}
											</TableCell>
											<TableCell>
												{payout.status === "paid" ? (
													<Badge variant="default" className="gap-1">
														<CheckCircle2 className="h-3 w-3" />
														Paid
													</Badge>
												) : payout.status === "pending" ? (
													<Badge variant="secondary" className="gap-1">
														<Clock className="h-3 w-3" />
														Pending
													</Badge>
												) : (
													<Badge variant="destructive" className="gap-1">
														<AlertCircle className="h-3 w-3" />
														Failed
													</Badge>
												)}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{payout.periodStart && payout.periodEnd
													? `${formatDate(payout.periodStart)} - ${formatDate(payout.periodEnd)}`
													: "N/A"}
											</TableCell>
											<TableCell>
												{payout.stripeTransferId ? (
													<div className="flex items-center gap-2">
														<code className="text-xs">{payout.stripeTransferId.slice(0, 20)}...</code>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => copyToClipboard(payout.stripeTransferId!)}
														>
															<Copy className="h-4 w-4" />
														</Button>
													</div>
												) : (
													<span className="text-muted-foreground">N/A</span>
												)}
											</TableCell>
											<TableCell className="text-right">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														toast.info("Payout details coming soon");
													}}
												>
													View Details
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className="mt-4 flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, filteredAndSortedPayouts.length)} of {filteredAndSortedPayouts.length} payouts
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage - 1)}
											disabled={currentPage === 0}
										>
											Previous
										</Button>
										<div className="flex items-center gap-1">
											{Array.from({ length: totalPages }, (_, i) => (
												<Button
													key={i}
													variant={currentPage === i ? "default" : "outline"}
													size="sm"
													onClick={() => setCurrentPage(i)}
												>
													{i + 1}
												</Button>
											))}
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setCurrentPage(currentPage + 1)}
											disabled={currentPage === totalPages - 1}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* Connect Onboarding Dialog */}
			<ConnectOnboardingDialog
				open={isConnectDialogOpen}
				onOpenChange={setIsConnectDialogOpen}
			/>
		</div>
	);
}

