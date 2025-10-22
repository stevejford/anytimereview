"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { announceToScreenReader } from "@/lib/accessibility";

import {
	getPublicListings,
	type Listing,
	type SearchListingsParams,
} from "@/lib/api-client";
import { getSeedListings, SEED_ENABLED } from "@/lib/seed-data";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	ToggleGroup,
	ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import EmptyState from "@/components/empty-state";
import { Search, X, Globe, CheckCircle2, SlidersHorizontal, Eye, Activity, Star } from "lucide-react";

const MODE_FILTERS = [
	{ value: "all", label: "All" },
	{ value: "exclusive", label: "Exclusive" },
	{ value: "shared_slugs", label: "Shared Slugs" },
];

function formatCurrency(cents: number | null) {
	if (typeof cents !== "number") return null;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

function getFilters(
	query: string,
	mode: string,
): SearchListingsParams {
	const base: SearchListingsParams = {};
	if (query.trim()) {
		base.search = query.trim();
	}
	if (mode !== "all") {
		base.mode = mode as Listing["mode"];
	}
	return base;
}

export default function BrowsePage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Initialize state from URL params
	const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
	const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get("search") || "");
	const [modeFilter, setModeFilter] = useState<string>(() => {
		const mode = searchParams.get("mode");
		// Map "shared" to "shared_slugs" for compatibility
		if (mode === "shared") return "shared_slugs";
		return mode || "all";
	});
	const [sortBy, setSortBy] = useState<string>("newest");
	const [priceMin, setPriceMin] = useState<string>(searchParams.get("priceMin") || "");
	const [priceMax, setPriceMax] = useState<string>(searchParams.get("priceMax") || "");
	const [verifiedOnly, setVerifiedOnly] = useState<boolean>(searchParams.get("verified") === "true");
	const [showFilters, setShowFilters] = useState(false);
	const [page, setPage] = useState(0);
	const [allListings, setAllListings] = useState<Listing[]>([]);
	const [quickViewListing, setQuickViewListing] = useState<Listing | null>(null);

	// Debounce search query by 300ms
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchQuery(searchQuery);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchQuery]);

	// Sync state when URL params change
	useEffect(() => {
		const search = searchParams.get("search") || "";
		const mode = searchParams.get("mode") || "all";
		const min = searchParams.get("priceMin") || "";
		const max = searchParams.get("priceMax") || "";
		const verified = searchParams.get("verified") === "true";

		setSearchQuery(search);
		setDebouncedSearchQuery(search);
		setModeFilter(mode === "shared" ? "shared_slugs" : mode);
		setPriceMin(min);
		setPriceMax(max);
		setVerifiedOnly(verified);
		setPage(0); // Reset page when params change
	}, [searchParams]);

	const filters = useMemo(
		() => getFilters(debouncedSearchQuery, modeFilter),
		[debouncedSearchQuery, modeFilter],
	);

	const {
		data: listings,
		isLoading,
		isError,
	} = useQuery<Listing[]>({
		queryKey: ["browse-listings", filters, page],
		queryFn: () => getPublicListings({
			...filters,
			page: page + 1, // API expects 1-based page numbers
			limit: 12,
		}),
		keepPreviousData: true,
	});

	// Merge real listings with seed data
	const displayListings = useMemo(() => {
		const seedData = getSeedListings();
		const realListings = listings || [];

		// If we have real listings, use them; otherwise use seed data
		if (realListings.length > 0) {
			return realListings;
		}

		return seedData;
	}, [listings]);

	// Track if using seed data
	const isUsingSeed = SEED_ENABLED && (!listings || listings.length === 0);

	// Accumulate listings when new page loads
	useEffect(() => {
		if (displayListings) {
			if (page === 0) {
				// Reset on first page
				setAllListings(displayListings);
			} else {
				// Skip appending when using seed data to prevent duplication
				if (isUsingSeed) return;
				// Append new listings
				setAllListings((prev) => [...prev, ...displayListings]);
			}
		}
	}, [displayListings, page, isUsingSeed]);

	// Reset accumulated listings when filters change
	useEffect(() => {
		setAllListings([]);
		setPage(0);
	}, [debouncedSearchQuery, modeFilter]);

	// Client-side filtering and sorting
	const filteredAndSortedListings = useMemo(() => {
		if (!allListings || allListings.length === 0) return [];

		let filtered = [...allListings];

		// Price range filtering
		if (priceMin || priceMax) {
			filtered = filtered.filter((listing) => {
				const price = listing.pricePeriodCents || 0;
				const priceDollars = price / 100;
				const min = priceMin ? parseFloat(priceMin) : 0;
				const max = priceMax ? parseFloat(priceMax) : Infinity;
				return priceDollars >= min && priceDollars <= max;
			});
		}

		// Verified filter
		if (verifiedOnly) {
			filtered = filtered.filter((listing) =>
				listing.domain?.verificationStatus === "verified"
			);
		}

		// Sorting with date validation
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "newest": {
					const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					// Guard against invalid dates
					const timeA = isFinite(dateA) ? dateA : 0;
					const timeB = isFinite(dateB) ? dateB : 0;
					return timeB - timeA;
				}
				case "oldest": {
					const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
					const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
					const timeA = isFinite(dateA) ? dateA : 0;
					const timeB = isFinite(dateB) ? dateB : 0;
					return timeA - timeB;
				}
				case "price-high":
					return (b.pricePeriodCents || 0) - (a.pricePeriodCents || 0);
				case "price-low":
					return (a.pricePeriodCents || 0) - (b.pricePeriodCents || 0);
				case "name-asc":
					return (a.domain?.fqdn || "").localeCompare(b.domain?.fqdn || "");
				case "name-desc":
					return (b.domain?.fqdn || "").localeCompare(a.domain?.fqdn || "");
				default:
					return 0;
			}
		});

		return filtered;
	}, [allListings, priceMin, priceMax, verifiedOnly, sortBy]);

	// Announce filter results to screen readers
	useEffect(() => {
		if (!isLoading && filteredAndSortedListings) {
			const count = filteredAndSortedListings.length;
			const message = count === 0
				? "No listings found matching your filters"
				: `Found ${count} listing${count === 1 ? "" : "s"}`;
			announceToScreenReader(message);
		}
	}, [filteredAndSortedListings, isLoading]);

	const hasActiveFilters = debouncedSearchQuery.trim() !== "" || modeFilter !== "all" || priceMin !== "" || priceMax !== "" || verifiedOnly;
	const activeFilterCount = [
		debouncedSearchQuery.trim() !== "",
		modeFilter !== "all",
		priceMin !== "",
		priceMax !== "",
		verifiedOnly,
	].filter(Boolean).length;

	const clearFilters = () => {
		setSearchQuery("");
		setDebouncedSearchQuery("");
		setModeFilter("all");
		setPriceMin("");
		setPriceMax("");
		setVerifiedOnly(false);
		setPage(0);
		// Update URL to clear params
		router.push("/browse");
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div className="space-y-2">
					<div className="flex items-center gap-3">
						<h1 className="mb-2 text-3xl font-bold">Browse Domain Listings</h1>
						{SEED_ENABLED && (!listings || listings.length === 0) && (
							<Badge variant="secondary" className="mb-2">
								Demo Data
							</Badge>
						)}
					</div>
					<p className="text-muted-foreground">
						Discover premium domains available for hire.
					</p>
					{!isLoading && filteredAndSortedListings && (
						<p className="text-sm text-primary">
							Showing {filteredAndSortedListings.length} domain{filteredAndSortedListings.length === 1 ? "" : "s"}
						</p>
					)}
				</div>

				{/* Featured Listings */}
				{!isLoading && allListings && allListings.length > 0 && page === 0 && (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Star className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-bold">Featured Domains</h2>
						</div>
						<div className="grid gap-4 md:grid-cols-3">
							{allListings.slice(0, 3).map((listing) => {
								const domainLabel = listing.domain?.fqdn;
								const periodPrice = formatCurrency(listing.pricePeriodCents);
								const clickPrice = formatCurrency(listing.priceClickCents);

								return (
									<Card
										key={listing.id}
										className="group transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
									>
										<CardHeader>
											<div className="flex items-center gap-2">
												<Globe className="h-4 w-4 text-primary" />
												<CardTitle className="text-lg font-bold">
													{domainLabel ?? listing.domainId}
												</CardTitle>
											</div>
											{listing.domain?.verificationStatus === "verified" && (
												<Badge variant="default" className="mt-2 w-fit gap-1">
													<CheckCircle2 className="h-3 w-3" />
													Verified
												</Badge>
											)}
										</CardHeader>
										<CardContent className="space-y-2">
											<Badge
												variant={listing.mode === "exclusive" ? "default" : "secondary"}
												className="capitalize"
											>
												{listing.mode === "exclusive" ? "Exclusive" : "Shared Slugs"}
											</Badge>
											<div>
												{periodPrice && (
													<p className="text-xl font-bold text-primary">{periodPrice}/month</p>
												)}
												{clickPrice && (
													<p className="text-xl font-bold text-primary">{clickPrice} per click</p>
												)}
											</div>
										</CardContent>
										<CardFooter className="flex gap-2">
											<Button asChild size="sm" className="flex-1">
												<Link href={`/browse/${listing.id}`}>View Details</Link>
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => setQuickViewListing(listing)}
											>
												<Eye className="h-4 w-4" />
											</Button>
										</CardFooter>
									</Card>
								);
							})}
						</div>
					</div>
				)}

				{/* Filter Section */}
				<div className="space-y-4">
					{/* Mobile Filter Button */}
					<div className="flex items-center gap-2 md:hidden">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search domains..."
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className="pl-10 focus-visible:ring-primary"
							/>
						</div>
						<Sheet open={showFilters} onOpenChange={setShowFilters}>
							<SheetTrigger asChild>
								<Button variant="outline" className="relative">
									<SlidersHorizontal className="mr-2 h-4 w-4" />
									Filters
									{activeFilterCount > 0 && (
										<Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
											{activeFilterCount}
										</Badge>
									)}
								</Button>
							</SheetTrigger>
							<SheetContent side="bottom" className="h-[80vh]">
								<SheetHeader>
									<SheetTitle>Filters</SheetTitle>
									<SheetDescription>
										Refine your search to find the perfect domain
									</SheetDescription>
								</SheetHeader>
								<div className="mt-6 space-y-6">
									{/* Mode Filter */}
									<div>
										<label className="mb-2 block text-sm font-medium">Mode</label>
										<ToggleGroup
											type="single"
											value={modeFilter}
											onValueChange={(value) => value && setModeFilter(value)}
											className="justify-start"
										>
											{MODE_FILTERS.map(({ value, label }) => (
												<ToggleGroupItem key={value} value={value}>
													{label}
												</ToggleGroupItem>
											))}
										</ToggleGroup>
									</div>

									{/* Sort */}
									<div>
										<label className="mb-2 block text-sm font-medium">Sort by</label>
										<Select value={sortBy} onValueChange={setSortBy}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="newest">Newest</SelectItem>
												<SelectItem value="oldest">Oldest</SelectItem>
												<SelectItem value="price-high">Price: High to Low</SelectItem>
												<SelectItem value="price-low">Price: Low to High</SelectItem>
												<SelectItem value="name-asc">Name A-Z</SelectItem>
												<SelectItem value="name-desc">Name Z-A</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{/* Price Range */}
									<div>
										<label className="mb-2 block text-sm font-medium">Price Range (monthly)</label>
										<div className="flex gap-2">
											<div className="relative flex-1">
												<span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
												<Input
													type="number"
													placeholder="Min"
													value={priceMin}
													onChange={(e) => setPriceMin(e.target.value)}
													className="pl-7 focus-visible:ring-primary"
												/>
											</div>
											<div className="relative flex-1">
												<span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
												<Input
													type="number"
													placeholder="Max"
													value={priceMax}
													onChange={(e) => setPriceMax(e.target.value)}
													className="pl-7 focus-visible:ring-primary"
												/>
											</div>
										</div>
									</div>

									{/* Actions */}
									<div className="flex gap-2">
										<Button onClick={() => setShowFilters(false)} className="flex-1">
											Apply
										</Button>
										<Button variant="outline" onClick={clearFilters} className="flex-1">
											Reset
										</Button>
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>

					{/* Desktop Filters */}
					<div className="hidden items-center gap-4 md:flex">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search domains..."
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								className="pl-10 focus-visible:ring-primary"
							/>
						</div>

						<ToggleGroup
							type="single"
							value={modeFilter}
							onValueChange={(value) => value && setModeFilter(value)}
							className="justify-start"
						>
							{MODE_FILTERS.map(({ value, label }) => (
								<ToggleGroupItem key={value} value={value}>
									{label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>

						<Select value={sortBy} onValueChange={setSortBy}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="oldest">Oldest</SelectItem>
								<SelectItem value="price-high">Price: High to Low</SelectItem>
								<SelectItem value="price-low">Price: Low to High</SelectItem>
								<SelectItem value="name-asc">Name A-Z</SelectItem>
								<SelectItem value="name-desc">Name Z-A</SelectItem>
							</SelectContent>
						</Select>

						<div className="flex gap-2">
							<div className="relative w-28">
								<span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
								<Input
									type="number"
									placeholder="Min"
									value={priceMin}
									onChange={(e) => setPriceMin(e.target.value)}
									className="pl-7 focus-visible:ring-primary"
								/>
							</div>
							<div className="relative w-28">
								<span className="absolute left-3 top-3 text-sm text-muted-foreground">$</span>
								<Input
									type="number"
									placeholder="Max"
									value={priceMax}
									onChange={(e) => setPriceMax(e.target.value)}
									className="pl-7 focus-visible:ring-primary"
								/>
							</div>
						</div>

						{hasActiveFilters && (
							<Button variant="ghost" size="sm" onClick={clearFilters}>
								<X className="mr-2 h-4 w-4" />
								Clear
							</Button>
						)}
					</div>

					{/* Active Filter Badges */}
					{activeFilterCount > 0 && (
						<div className="flex flex-wrap gap-2">
							<span className="text-sm text-muted-foreground">Active filters:</span>
							{debouncedSearchQuery && (
								<Badge variant="secondary" className="gap-1">
									Search: {debouncedSearchQuery}
									<button
										onClick={() => {
											setSearchQuery("");
											setDebouncedSearchQuery("");
										}}
										className="ml-1 hover:text-destructive"
									>
										×
									</button>
								</Badge>
							)}
							{modeFilter !== "all" && (
								<Badge variant="secondary" className="gap-1">
									Mode: {MODE_FILTERS.find((f) => f.value === modeFilter)?.label}
									<button
										onClick={() => setModeFilter("all")}
										className="ml-1 hover:text-destructive"
									>
										×
									</button>
								</Badge>
							)}
							{priceMin && (
								<Badge variant="secondary" className="gap-1">
									Min: ${priceMin}
									<button
										onClick={() => setPriceMin("")}
										className="ml-1 hover:text-destructive"
									>
										×
									</button>
								</Badge>
							)}
							{priceMax && (
								<Badge variant="secondary" className="gap-1">
									Max: ${priceMax}
									<button
										onClick={() => setPriceMax("")}
										className="ml-1 hover:text-destructive"
									>
										×
									</button>
								</Badge>
							)}
							{verifiedOnly && (
								<Badge variant="secondary" className="gap-1">
									Verified Only
									<button
										onClick={() => setVerifiedOnly(false)}
										className="ml-1 hover:text-destructive"
									>
										×
									</button>
								</Badge>
							)}
						</div>
					)}
				</div>

			{/* Listings Grid */}
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{isLoading &&
					Array.from({ length: 6 }).map((_, index) => (
						<Card key={`skeleton-${index}`} className="space-y-4 p-6">
							<Skeleton className="h-6 w-2/3" />
							<Skeleton className="h-4 w-1/3" />
							<Skeleton className="h-10 w-full" />
						</Card>
					))}

				{isError && (
					<Card className="col-span-full">
						<CardContent className="py-6 text-center text-sm text-destructive">
							Unable to load listings. Please try again later.
						</CardContent>
					</Card>
				)}

					{!isLoading && filteredAndSortedListings?.length === 0 && (
					<div className="col-span-full">
						<EmptyState
							icon={<Search className="text-primary" />}
							title="No listings found"
							description={
								hasActiveFilters
									? "Try adjusting your filters or search terms to find more results."
									: "No listings are currently available. Check back later or be the first to list your domain!"
							}
							action={
								hasActiveFilters
									? {
											label: "Clear Filters",
											onClick: clearFilters,
									  }
									: {
											label: "List Your Domain",
											onClick: () => (window.location.href = "/list-your-domain"),
									  }
							}
						/>
					</div>
				)}

				{filteredAndSortedListings?.map((listing) => {
	const domainLabel = listing.domain?.fqdn;
					const periodPrice = formatCurrency(listing.pricePeriodCents);
					const clickPrice = formatCurrency(listing.priceClickCents);

					return (
						<Card
							key={listing.id}
							className="group flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/20"
						>
							<CardHeader>
								<div className="flex items-center gap-2">
									<Globe className="h-5 w-5 text-primary" />
									<CardTitle className="text-xl font-bold">
										{domainLabel ?? listing.domainId}
									</CardTitle>
								</div>
								{listing.domain?.verificationStatus === "verified" && (
									<Badge variant="default" className="mt-2 w-fit gap-1">
										<CheckCircle2 className="h-3 w-3" />
										Verified
									</Badge>
								)}
							</CardHeader>
							<CardContent className="space-y-3">
								<Badge
									variant={listing.mode === "exclusive" ? "default" : "secondary"}
									className="capitalize"
								>
									{listing.mode === "exclusive" ? "Exclusive" : "Shared Slugs"}
								</Badge>
								<div className="space-y-1">
									{periodPrice && (
										<p className="text-2xl font-bold text-primary">{periodPrice}/month</p>
									)}
									{clickPrice && (
										<p className="text-2xl font-bold text-primary">{clickPrice} per click</p>
									)}
									{!periodPrice && !clickPrice && (
										<p className="text-lg text-muted-foreground">Contact for pricing</p>
									)}
								</div>
								{listing.createdAt && (
									<p className="text-xs text-muted-foreground">
										Listed {new Date(listing.createdAt).toLocaleDateString()}
									</p>
								)}
							</CardContent>
							<CardFooter className="flex items-center justify-between gap-2">
								<Button asChild className="flex-1">
									<Link href={`/browse/${listing.id}`}>View Details</Link>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setQuickViewListing(listing)}
								>
									<Eye className="h-4 w-4" />
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			{/* Load More Button */}
			{filteredAndSortedListings && filteredAndSortedListings.length > 0 && (
				<div className="mt-8 flex justify-center">
					<Button
						variant="outline"
						onClick={() => setPage((prev) => prev + 1)}
						disabled={isLoading || !listings || listings.length < 12}
					>
						{isLoading ? "Loading..." : listings && listings.length < 12 ? "No more results" : "Load More"}
					</Button>
				</div>
			)}

			{/* Quick View Dialog */}
			<Dialog open={!!quickViewListing} onOpenChange={(open) => !open && setQuickViewListing(null)}>
				<DialogContent className="max-w-2xl">
					{quickViewListing && (
						<>
							<DialogHeader>
								<div className="flex items-center gap-2">
									<Globe className="h-6 w-6 text-primary" />
									<DialogTitle className="text-2xl">
										{quickViewListing.domain?.fqdn || quickViewListing.domainId}
									</DialogTitle>
								</div>
								{quickViewListing.domain?.verificationStatus === "verified" && (
									<Badge variant="default" className="mt-2 w-fit gap-1">
										<CheckCircle2 className="h-4 w-4" />
										Verified Domain
									</Badge>
								)}
							</DialogHeader>
							<div className="space-y-6">
								{/* Pricing */}
								<div>
									<h3 className="mb-2 font-semibold">Pricing</h3>
									<div className="space-y-1">
										{quickViewListing.pricePeriodCents && (
											<p className="text-2xl font-bold text-primary">
												{formatCurrency(quickViewListing.pricePeriodCents)}/month
											</p>
										)}
										{quickViewListing.priceClickCents && (
											<p className="text-2xl font-bold text-primary">
												{formatCurrency(quickViewListing.priceClickCents)} per click
											</p>
										)}
										{!quickViewListing.pricePeriodCents && !quickViewListing.priceClickCents && (
											<p className="text-muted-foreground">Contact for pricing</p>
										)}
									</div>
								</div>

								{/* Mode */}
								<div>
									<h3 className="mb-2 font-semibold">Hire Mode</h3>
									<Badge
										variant={quickViewListing.mode === "exclusive" ? "default" : "secondary"}
										className="capitalize"
									>
										{quickViewListing.mode === "exclusive" ? "Exclusive Access" : "Shared Slugs"}
									</Badge>
									<p className="mt-2 text-sm text-muted-foreground">
										{quickViewListing.mode === "exclusive"
											? "Full control of all routes and traffic on this domain"
											: "Share the domain with other hirers using different URL paths"}
									</p>
								</div>

								{/* Description */}
								{quickViewListing.description && (
									<div>
										<h3 className="mb-2 font-semibold">Description</h3>
										<p className="text-sm text-muted-foreground">{quickViewListing.description}</p>
									</div>
								)}

								{/* Details */}
								<div>
									<h3 className="mb-2 font-semibold">Details</h3>
									<div className="grid gap-2 text-sm">
										<div className="flex justify-between">
											<span className="text-muted-foreground">Status:</span>
											<Badge variant="outline" className="capitalize">
												{quickViewListing.status}
											</Badge>
										</div>
										{quickViewListing.createdAt && (
											<div className="flex justify-between">
												<span className="text-muted-foreground">Listed:</span>
												<span>{new Date(quickViewListing.createdAt).toLocaleDateString()}</span>
											</div>
										)}
									</div>
								</div>

								{/* Actions */}
								<div className="flex gap-2">
									<Button asChild className="flex-1">
										<Link href={`/browse/${quickViewListing.id}`}>View Full Details</Link>
									</Button>
									<Button variant="outline" onClick={() => setQuickViewListing(null)}>
										Close
									</Button>
								</div>
							</div>
						</>
					)}
				</DialogContent>
			</Dialog>
			</div>
		</div>
	);
}


