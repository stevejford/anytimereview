"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { getListings, getDomains, updateListing, deleteListing } from "@/lib/api-client";
import { MetricCard } from "@/components/analytics/metric-card";
import { DataTable } from "@/components/listings/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Listing } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
	Plus,
	FileText,
	DollarSign,
	Eye,
	MoreHorizontal,
	Pause,
	Play,
	Trash2,
	TrendingUp,
	Copy,
	Activity,
	X,
	ArrowUpDown,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function HostListingsPage() {
	const queryClient = useQueryClient();
	const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
	const [statusFilter, setStatusFilter] = React.useState<string>("all");
	const [modeFilter, setModeFilter] = React.useState<string>("all");
	const [priceMin, setPriceMin] = React.useState<string>("");
	const [priceMax, setPriceMax] = React.useState<string>("");
	const [domainFilter, setDomainFilter] = React.useState<string>("all");
	const [sortBy, setSortBy] = React.useState<string>("newest");

	// Fetch data
	const { data: listings, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useQuery({
		queryKey: ["listings"],
		queryFn: getListings,
	});

	const { data: domains, isLoading: domainsLoading, error: domainsError, refetch: refetchDomains } = useQuery({
		queryKey: ["domains"],
		queryFn: getDomains,
	});

	// Mutations
	const updateListingMutation = useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) => updateListing(id, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["listings"] });
			toast.success("Listing updated successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update listing");
		},
	});

	const deleteListingMutation = useMutation({
		mutationFn: (id: string) => deleteListing(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["listings"] });
			toast.success("Listing deleted successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete listing");
		},
	});

	// Calculate metrics
	const activeListings = listings?.filter((l) => l.status === "active") || [];
	const totalRevenue = activeListings.reduce((sum, l) => {
		// Estimate revenue based on active rentals (if available)
		return sum + (l.pricePeriodCents || 0);
	}, 0);
	const averagePrice = activeListings.length > 0
		? activeListings.reduce((sum, l) => sum + (l.pricePeriodCents || 0), 0) / activeListings.length
		: 0;

	// Filter listings
	const filteredListings = React.useMemo(() => {
		if (!listings) return [];

		let filtered = listings;

		// Status filter
		if (statusFilter !== "all") {
			filtered = filtered.filter((l) => l.status === statusFilter);
		}

		// Mode filter
		if (modeFilter !== "all") {
			filtered = filtered.filter((l) => l.mode === modeFilter);
		}

		// Domain filter
		if (domainFilter !== "all") {
			filtered = filtered.filter((l) => l.domainId === domainFilter);
		}

		// Price range filter
		if (priceMin) {
			const minCents = parseFloat(priceMin) * 100;
			filtered = filtered.filter((l) => (l.pricePeriodCents || 0) >= minCents);
		}
		if (priceMax) {
			const maxCents = parseFloat(priceMax) * 100;
			filtered = filtered.filter((l) => (l.pricePeriodCents || 0) <= maxCents);
		}

		// Sort
		filtered = [...filtered].sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			} else if (sortBy === "oldest") {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			} else if (sortBy === "highest_price") {
				return (b.pricePeriodCents || 0) - (a.pricePeriodCents || 0);
			} else if (sortBy === "lowest_price") {
				return (a.pricePeriodCents || 0) - (b.pricePeriodCents || 0);
			}
			return 0;
		});

		return filtered;
	}, [listings, statusFilter, modeFilter, domainFilter, priceMin, priceMax, sortBy]);

	// Status counts
	const statusCounts = React.useMemo(() => {
		if (!listings) return { all: 0, active: 0, paused: 0, draft: 0 };
		return {
			all: listings.length,
			active: listings.filter((l) => l.status === "active").length,
			paused: listings.filter((l) => l.status === "paused").length,
			draft: listings.filter((l) => l.status === "draft").length,
		};
	}, [listings]);

	// Mode counts
	const modeCounts = React.useMemo(() => {
		if (!listings) return { all: 0, exclusive: 0, shared_slugs: 0 };
		return {
			all: listings.length,
			exclusive: listings.filter((l) => l.mode === "exclusive").length,
			shared_slugs: listings.filter((l) => l.mode === "shared_slugs").length,
		};
	}, [listings]);

	// Bulk actions
	const handleBulkActivate = () => {
		selectedIds.forEach((id) => {
			updateListingMutation.mutate({ id, data: { status: "active" } });
		});
		setSelectedIds([]);
	};

	const handleBulkPause = () => {
		selectedIds.forEach((id) => {
			updateListingMutation.mutate({ id, data: { status: "paused" } });
		});
		setSelectedIds([]);
	};

	const handleBulkDelete = () => {
		if (confirm(`Are you sure you want to delete ${selectedIds.length} listing(s)?`)) {
			selectedIds.forEach((id) => {
				deleteListingMutation.mutate(id);
			});
			setSelectedIds([]);
		}
	};

	const isLoading = listingsLoading || domainsLoading;

	// Enhanced columns with selection and actions
	const hostColumns: ColumnDef<Listing>[] = React.useMemo(() => [
		{
			id: "select",
			header: ({ table }) => (
				<Checkbox
					checked={table.getIsAllPageRowsSelected()}
					onCheckedChange={(value) => {
						table.toggleAllPageRowsSelected(!!value);
						if (value) {
							setSelectedIds(table.getRowModel().rows.map((row) => row.original.id));
						} else {
							setSelectedIds([]);
						}
					}}
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={selectedIds.includes(row.original.id)}
					onCheckedChange={(value) => {
						if (value) {
							setSelectedIds([...selectedIds, row.original.id]);
						} else {
							setSelectedIds(selectedIds.filter((id) => id !== row.original.id));
						}
					}}
					aria-label="Select row"
				/>
			),
			enableSorting: false,
			enableHiding: false,
		},
		{
			id: "domain",
			accessorFn: (row) => row.domain?.fqdn ?? row.domainId,
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
					className="flex items-center gap-2"
				>
					Domain
					<ArrowUpDown className="h-4 w-4" />
				</Button>
			),
			cell: ({ row }) => {
				const listing = row.original;
				const fqdn = listing.domain?.fqdn ?? listing.domainId;
				return <span className="font-medium">{fqdn}</span>;
			},
		},
		{
			accessorKey: "mode",
			header: "Mode",
			cell: ({ row }) => {
				const mode = row.getValue("mode") as Listing["mode"];
				const label = mode === "exclusive" ? "Exclusive" : "Shared Slugs";
				return (
					<Badge variant={mode === "exclusive" ? "default" : "secondary"}>
						{label}
					</Badge>
				);
			},
		},
		{
			id: "pricing",
			header: "Pricing",
			cell: ({ row }) => {
				const period = row.original.pricePeriodCents;
				const click = row.original.priceClickCents;
				const formatter = new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: row.original.currency,
					minimumFractionDigits: 2,
				});
				const pieces: string[] = [];
				if (typeof period === "number") {
					pieces.push(`${formatter.format(period / 100)}/mo`);
				}
				if (typeof click === "number") {
					pieces.push(`${formatter.format(click / 100)}/click`);
				}
				return pieces.length > 0 ? pieces.join(" · ") : "—";
			},
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => {
				const status = row.getValue("status") as Listing["status"];
				let variant: React.ComponentProps<typeof Badge>["variant"] = "secondary";
				if (status === "active") {
					variant = "default";
				} else if (status === "paused") {
					variant = "outline";
				}
				return <Badge variant={variant}>{status.replace(/^./, (s) => s.toUpperCase())}</Badge>;
			},
		},
		{
			id: "performance",
			header: "Performance",
			cell: ({ row }) => {
				const listing = row.original;
				// Optional metrics - show if available
				return (
					<div className="flex gap-1">
						{listing.views !== undefined && (
							<Badge variant="outline" className="gap-1">
								<Eye className="h-3 w-3" />
								{listing.views}
							</Badge>
						)}
						{listing.activeRentals !== undefined && listing.activeRentals > 0 && (
							<Badge variant="default" className="gap-1">
								<Activity className="h-3 w-3" />
								{listing.activeRentals}
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const listing = row.original;
				return (
					<div className="flex items-center justify-end gap-2">
						<Switch
							checked={listing.status === "active"}
							onCheckedChange={(value) => {
								const newStatus = value ? "active" : "paused";
								updateListingMutation.mutate({
									id: listing.id,
									data: { status: newStatus },
								});
							}}
							aria-label="Toggle status"
						/>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() => {
										window.location.href = `/host/listings/${listing.id}/edit`;
									}}
								>
									Edit listing
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Eye className="mr-2 h-4 w-4" />
									View analytics
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										// Duplicate listing logic
										toast.info("Duplicate feature coming soon");
									}}
								>
									<Copy className="mr-2 h-4 w-4" />
									Duplicate
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive"
									onClick={() => {
										if (confirm(`Are you sure you want to delete this listing?`)) {
											deleteListingMutation.mutate(listing.id);
										}
									}}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	], [selectedIds, updateListingMutation, deleteListingMutation]);

	// Clear filters
	const clearFilters = () => {
		setPriceMin("");
		setPriceMax("");
		setDomainFilter("all");
		setSortBy("newest");
	};

	const hasActiveFilters = priceMin || priceMax || domainFilter !== "all" || sortBy !== "newest";

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Error Handling */}
			{(listingsError || domainsError) && (
				<Alert variant="destructive" className="mb-8">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Failed to load data. Please try again.</span>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									if (listingsError) refetchListings();
									if (domainsError) refetchDomains();
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
					<h1 className="text-3xl font-bold tracking-tight">My Listings</h1>
					<p className="text-muted-foreground">
						Manage your domain listings, pricing, and availability
					</p>
				</div>
				<div className="flex gap-2">
					{selectedIds.length > 0 && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline">
									Bulk Actions
									<Badge className="ml-2" variant="secondary">
										{selectedIds.length}
									</Badge>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleBulkActivate}>
									<Play className="mr-2 h-4 w-4 text-primary" />
									Activate Selected
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleBulkPause}>
									<Pause className="mr-2 h-4 w-4 text-secondary" />
									Pause Selected
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Selected
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
					<Link href="/host/listings/new">
						<Button variant="default">
							<Plus className="mr-2 h-4 w-4" />
							Create Listing
						</Button>
					</Link>
				</div>
			</div>

			{/* Metric Cards */}
			<div className="mb-8 grid gap-6 md:grid-cols-3">
				{isLoading ? (
					<>
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
						<Skeleton className="h-32" />
					</>
				) : (
					<>
						<MetricCard
							title="Total Revenue"
							value={`$${(totalRevenue / 100).toFixed(2)}`}
							icon={<DollarSign className="h-5 w-5 text-primary" />}
							description="Estimated monthly"
						/>
						<MetricCard
							title="Average Price"
							value={`$${(averagePrice / 100).toFixed(2)}`}
							icon={<TrendingUp className="h-5 w-5 text-primary" />}
							description="Per listing"
						/>
						<MetricCard
							title="Total Views"
							value="N/A"
							icon={<Eye className="h-5 w-5 text-primary" />}
							description="Analytics coming soon"
						/>
					</>
				)}
			</div>

			{/* Advanced Filters */}
			<div className="mb-6 space-y-4">
				<div className="flex flex-wrap gap-4">
					{/* Price Range Filter */}
					<div className="flex items-center gap-2">
						<Label htmlFor="price-min" className="text-sm">Price:</Label>
						<Input
							id="price-min"
							type="number"
							placeholder="Min"
							value={priceMin}
							onChange={(e) => setPriceMin(e.target.value)}
							className="w-24"
						/>
						<span className="text-muted-foreground">-</span>
						<Input
							id="price-max"
							type="number"
							placeholder="Max"
							value={priceMax}
							onChange={(e) => setPriceMax(e.target.value)}
							className="w-24"
						/>
					</div>

					{/* Domain Filter */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Domain: {domainFilter === "all" ? "All" : domains?.find(d => d.id === domainFilter)?.fqdn || "All"}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => setDomainFilter("all")}>
								All domains
							</DropdownMenuItem>
							{domains?.map((domain) => (
								<DropdownMenuItem key={domain.id} onClick={() => setDomainFilter(domain.id)}>
									{domain.fqdn}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Sort Options */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : sortBy === "highest_price" ? "Highest Price" : "Lowest Price"}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => setSortBy("newest")}>
								Newest first
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("oldest")}>
								Oldest first
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("highest_price")}>
								Highest price
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("lowest_price")}>
								Lowest price
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Clear Filters */}
					{hasActiveFilters && (
						<Button variant="ghost" onClick={clearFilters}>
							<X className="mr-2 h-4 w-4" />
							Clear filters
						</Button>
					)}
				</div>

				{/* Active Filter Badges */}
				{hasActiveFilters && (
					<div className="flex flex-wrap gap-2">
						{priceMin && (
							<Badge variant="secondary" className="gap-1">
								Min: ${priceMin}
								<X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMin("")} />
							</Badge>
						)}
						{priceMax && (
							<Badge variant="secondary" className="gap-1">
								Max: ${priceMax}
								<X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMax("")} />
							</Badge>
						)}
						{domainFilter !== "all" && (
							<Badge variant="secondary" className="gap-1">
								Domain: {domains?.find(d => d.id === domainFilter)?.fqdn}
								<X className="h-3 w-3 cursor-pointer" onClick={() => setDomainFilter("all")} />
							</Badge>
						)}
					</div>
				)}
			</div>

			{/* Tabs for Mode Filter */}
			<Tabs value={modeFilter} onValueChange={setModeFilter} className="mb-6">
				<TabsList>
					<TabsTrigger value="all">
						All ({modeCounts.all})
					</TabsTrigger>
					<TabsTrigger value="exclusive">
						Exclusive ({modeCounts.exclusive})
					</TabsTrigger>
					<TabsTrigger value="shared_slugs">
						Shared Slugs ({modeCounts.shared_slugs})
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Status Filter Tabs */}
			<Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
				<TabsList>
					<TabsTrigger value="all">
						All ({statusCounts.all})
					</TabsTrigger>
					<TabsTrigger value="active">
						Active ({statusCounts.active})
					</TabsTrigger>
					<TabsTrigger value="paused">
						Paused ({statusCounts.paused})
					</TabsTrigger>
					<TabsTrigger value="draft">
						Draft ({statusCounts.draft})
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Data Table */}
			{isLoading ? (
				<Card>
					<CardContent className="pt-6">
						<Skeleton className="h-96" />
					</CardContent>
				</Card>
			) : filteredListings.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<FileText className="mx-auto mb-4 h-16 w-16 text-primary" />
						<h3 className="mb-2 text-xl font-semibold">No listings yet</h3>
						<p className="mb-6 text-muted-foreground">
							Create your first listing to start earning from your domains. You can choose between
							exclusive access or shared slug rentals.
						</p>
						<div className="flex justify-center gap-4">
							<Link href="/host/listings/new">
								<Button variant="default">
									<Plus className="mr-2 h-4 w-4" />
									Create Listing
								</Button>
							</Link>
							<Button variant="outline">Learn More</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<DataTable
					columns={hostColumns}
					data={filteredListings}
				/>
			)}
		</div>
	);
}

