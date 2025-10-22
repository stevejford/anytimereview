"use client";

import Link from "next/link";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";

import { type Rental } from "@/lib/api-client";
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

function formatDate(value: string | null) {
	if (!value) return null;
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "numeric",
	}).format(new Date(value));
}

export const columns: ColumnDef<Rental>[] = [
	{
		accessorFn: (row) => row.listing?.domain?.fqdn ?? row.listingId,
		id: "listingLabel",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				className="px-0"
			>
				Domain
				<ArrowUpDown className="ml-2 h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const rental = row.original;
			const fqdn = rental.listing?.domain?.fqdn ?? rental.listingId;
			return (
				<Link href={`/browse/${rental.listingId}`} className="font-medium">
					{fqdn}
				</Link>
			);
		},
	},
	{
		accessorKey: "type",
		header: "Type",
		cell: ({ row }) => (
			<Badge variant={row.original.type === "period" ? "default" : "secondary"}>
				{row.original.type === "period" ? "Monthly" : "Per click"}
			</Badge>
		),
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const { status } = row.original;
			const variant =
				status === "active"
					? "default"
					: status === "ended"
						? "secondary"
						: "destructive";
			return (
				<Badge variant={variant} className="capitalize">
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "startAt",
		header: "Started",
		cell: ({ row }) => formatDate(row.original.startAt) ?? "—",
	},
	{
		accessorKey: "endAt",
		header: "Ends",
		cell: ({ row }) => {
			const { endAt, status } = row.original;
			if (!endAt && status === "active") {
				return "Active";
			}
			return formatDate(endAt) ?? "—";
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const rental = row.original;
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem asChild>
							<Link href={`/dashboard/rentals/${rental.id}`}>
								View details
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`/dashboard/rentals/${rental.id}/routes`}>
								Configure routes
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`/dashboard/rentals/${rental.id}/analytics`}>
								View analytics
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem disabled>Cancel rental</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];


