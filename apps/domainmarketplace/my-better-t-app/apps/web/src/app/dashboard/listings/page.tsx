"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Filter, FileText } from "lucide-react";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import EmptyState from "@/components/empty-state";

import {
	getDomains,
	getListings,
	updateListing,
	type Domain,
	type Listing,
} from "@/lib/api-client";
import { columns } from "@/components/listings/columns";
import { DataTable } from "@/components/listings/data-table";
import { ListingDialog } from "@/components/listings/listing-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type StatusFilter = "all" | "draft" | "active" | "paused";
type ModeFilter = "all" | "exclusive" | "shared_slugs";

export default function ListingsPage() {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [selectedListing, setSelectedListing] = React.useState<Listing | null>(null);
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
	const [modeFilter, setModeFilter] = React.useState<ModeFilter>("all");
	const queryClient = useQueryClient();

	const listingsQuery = useQuery({
		queryKey: ["listings", statusFilter, modeFilter],
		queryFn: async () =>
			getListings({
				status: statusFilter === "all" ? undefined : statusFilter,
				mode: modeFilter === "all" ? undefined : modeFilter,
			}),
	});

	const domainsQuery = useQuery({
		queryKey: ["domains"],
		queryFn: getDomains,
	});

	const handleOpenCreate = React.useCallback(() => {
		setSelectedListing(null);
		setIsDialogOpen(true);
	}, []);

	const handleEdit = React.useCallback((listing: Listing) => {
		setSelectedListing(listing);
		setIsDialogOpen(true);
	}, []);

	const handleToggleStatus = React.useCallback(
		async (id: string, status: Listing["status"]) => {
			await updateListing(id, { status });
			queryClient.invalidateQueries({ queryKey: ["listings"] });
		},
		[queryClient],
	);

	const listings = listingsQuery.data ?? [];
	const domains = React.useMemo(() => domainsQuery.data ?? [], [domainsQuery.data]);
	const statusCounts = React.useMemo(
		() =>
			listings.reduce(
				(acc, listing) => {
					acc.all += 1;
					acc[listing.status] += 1;
					return acc;
				},
				{ all: 0, draft: 0, active: 0, paused: 0 } as Record<StatusFilter, number>,
			),
		[listings],
	);

	const modeCounts = React.useMemo(
		() =>
			listings.reduce(
				(acc, listing) => {
					acc.all += 1;
					acc[listing.mode] += 1;
					return acc;
				},
				{ all: 0, exclusive: 0, shared_slugs: 0 } as Record<ModeFilter, number>,
			),
		[listings],
	);

	const meta = React.useMemo(
		() => ({
			domains: domains.reduce<Record<string, { fqdn: string }>>((acc, domain) => {
				acc[domain.id] = { fqdn: domain.fqdn };
				return acc;
			}, {}),
			onEdit: handleEdit,
			onToggleStatus: handleToggleStatus,
		}),
	[domains, handleToggleStatus, handleEdit],
	);

	const tableColumns = React.useMemo(() => columns, []);
	const isLoading = listingsQuery.isLoading || domainsQuery.isLoading;

	const statusLabel = React.useMemo(() => {
		if (statusFilter === "all") return "All statuses";
		if (statusFilter === "active") return "Active";
		if (statusFilter === "draft") return "Draft";
		return "Paused";
	}, [statusFilter]);

	const modeTabs = React.useMemo(
		() => (
			<Tabs value={modeFilter} onValueChange={(value) => setModeFilter(value as ModeFilter)}>
				<TabsList>
					{(["all", "exclusive", "shared_slugs"] as ModeFilter[]).map((mode) => (
						<TabsTrigger key={mode} value={mode}>
							<span className="flex items-center gap-2">
								{mode === "all"
									? "All"
									: mode === "exclusive"
										? "Exclusive"
										: "Shared slugs"}
								{modeCounts[mode] ? (
									<Badge variant="secondary" className="rounded-full px-2 text-xs">
										{modeCounts[mode]}
									</Badge>
								) : null}
							</span>
						</TabsTrigger>
					))}
				</TabsList>
				{(["all", "exclusive", "shared_slugs"] as ModeFilter[]).map((mode) => (
					<TabsContent key={mode} value={mode}>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between">
								<CardTitle>Listings</CardTitle>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="outline" size="sm" className="gap-2">
											<Filter className="h-4 w-4" />
											{statusLabel}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuLabel>Status</DropdownMenuLabel>
										{(["all", "active", "draft", "paused"] as StatusFilter[]).map((status) => (
											<DropdownMenuItem
												key={status}
												onSelect={() => setStatusFilter(status)}
												className="flex items-center justify-between"
											>
												<span>
													{status === "all"
														? "All statuses"
														: status === "active"
															? "Active"
															: status === "draft"
																? "Draft"
																: "Paused"}
												</span>
												{statusCounts[status] ? (
													<Badge variant="secondary" className="rounded-full px-2 text-xs">
														{statusCounts[status]}
													</Badge>
												) : null}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<div className="space-y-3">
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-full" />
										<Skeleton className="h-10 w-3/4" />
									</div>
								) : (
									<DataTable
										columns={tableColumns}
										data={listings}
										isLoading={listingsQuery.isLoading}
										meta={meta}
									/>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				))}
			</Tabs>
		),
		[isLoading, listings, listingsQuery.isLoading, meta, modeCounts, modeFilter, statusCounts, statusFilter, tableColumns],
	);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<section className="space-y-6">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold">My Listings</h1>
						<p className="text-muted-foreground">
							Manage your domain listings, pricing, and availability.
						</p>
					</div>
					<div className="flex gap-2">
						<Button onClick={handleOpenCreate}>
							<Plus className="mr-2 h-4 w-4" />
							Create listing
						</Button>
						<Button asChild variant="outline">
							<Link href="/dashboard/listings/new">
								<Plus className="mr-2 h-4 w-4" />
								Wizard
							</Link>
						</Button>
					</div>
				</div>
				{listings.length === 0 && !isLoading ? (
					<EmptyState
						icon={<FileText />}
						title="No listings yet"
						description="Create your first listing to start earning from your domains. Choose between exclusive access or shared slug hires."
						action={{
							label: 'Create Listing',
							onClick: handleOpenCreate,
						}}
					/>
				) : (
					modeTabs
				)}
				<ListingDialog
					isOpen={isDialogOpen}
					onOpenChange={setIsDialogOpen}
					listing={selectedListing}
					domains={domains}
					onSuccess={() => {
						queryClient.invalidateQueries({ queryKey: ["listings"] });
					}}
				/>
			</section>
		</div>
	);
}

