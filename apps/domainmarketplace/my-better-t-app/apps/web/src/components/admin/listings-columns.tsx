"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

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

export type AdminListingsTableMeta = {
	onApprove?: (listing: Listing) => void;
	onSuspend?: (listing: Listing) => void;
};

export const columns: ColumnDef<Listing>[] = [
	{
		accessorKey: "domain",
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
			const domain = listing.domain?.fqdn ?? listing.domainId;
			return <span className="font-medium">{domain}</span>;
		},
	},
	{
		accessorKey: "mode",
		header: "Mode",
		cell: ({ row }) => {
			const mode = row.getValue("mode") as string;
			const variant = mode === "exclusive" ? "default" : "secondary";
			return (
				<Badge variant={variant}>
					{mode === "shared_slugs" ? "Shared Slugs" : "Exclusive"}
				</Badge>
			);
		},
	},
	{
		id: "pricing",
		header: "Pricing",
		cell: ({ row }) => {
			const listing = row.original;
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 2,
			});
			
			const hasPeriod = listing.pricePeriodCents !== null && listing.pricePeriodCents !== undefined;
			const hasClick = listing.priceClickCents !== null && listing.priceClickCents !== undefined;
			
			if (hasPeriod && hasClick) {
				return <span>Both</span>;
			}
			if (hasPeriod) {
				return <span>{formatter.format(listing.pricePeriodCents / 100)}/mo</span>;
			}
			if (hasClick) {
				return <span>{formatter.format(listing.priceClickCents / 100)}/click</span>;
			}
			return <span>—</span>;
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			let variant: React.ComponentProps<typeof Badge>["variant"] = "secondary";
			let icon = null;
			
			if (status === "active") {
				variant = "default";
				icon = <CheckCircle className="h-3 w-3 mr-1 text-green-500" />;
			} else if (status === "paused") {
				variant = "destructive";
				icon = <XCircle className="h-3 w-3 mr-1" />;
			}
			
			return (
				<Badge variant={variant} className="flex items-center w-fit">
					{icon}
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Created",
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string;
			return format(new Date(date), "MMM dd, yyyy");
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row, table }) => {
			const listing = row.original;
			const meta = table.options.meta as AdminListingsTableMeta | undefined;
			const onApprove = meta?.onApprove;
			const onSuspend = meta?.onSuspend;
			
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						{listing.status === "draft" && (
							<DropdownMenuItem onSelect={() => onApprove?.(listing)}>
								Approve
							</DropdownMenuItem>
						)}
						{listing.status === "active" && (
							<DropdownMenuItem onSelect={() => onSuspend?.(listing)}>
								Suspend
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							View details
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];


