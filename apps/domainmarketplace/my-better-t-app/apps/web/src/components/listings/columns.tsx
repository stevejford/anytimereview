"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";

import type { Listing } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type ListingsTableMeta = {
	domains?: Record<string, { fqdn: string }>;
	onToggleStatus?: (id: string, status: Listing["status"]) => void;
	onEdit?: (listing: Listing) => void;
};

export const columns: ColumnDef<Listing>[] = [
	{
		id: "domain",
		accessorFn: (row) => row.domain?.fqdn ?? row.domainId,
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
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
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue) return true;
			const listing = row.original;
			const fqdn = listing.domain?.fqdn ?? listing.domainId;
			const searchValue = String(filterValue).toLowerCase();
			return fqdn.toLowerCase().includes(searchValue);
		},
		sortingFn: (rowA, rowB, columnId) => {
			const aListing = rowA.original;
			const bListing = rowB.original;
			const aFqdn = aListing.domain?.fqdn ?? aListing.domainId;
			const bFqdn = bListing.domain?.fqdn ?? bListing.domainId;
			return aFqdn.localeCompare(bFqdn);
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
		id: "actions",
		header: "",
		cell: ({ row, table }) => {
			const listing = row.original;
			const meta = table.options.meta as ListingsTableMeta | undefined;
			const toggleStatus = meta?.onToggleStatus;
			const onEdit = meta?.onEdit;
			return (
				<div className="flex items-center justify-end gap-2">
					<Switch
						checked={listing.status === "active"}
						onCheckedChange={(value) =>
							toggleStatus?.(listing.id, value ? "active" : "paused")
						}
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
							<DropdownMenuItem onSelect={() => onEdit?.(listing)}>
								Edit listing
							</DropdownMenuItem>
							<DropdownMenuItem>View analytics</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-destructive">
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];

