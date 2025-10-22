"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

import type { Dispute } from "@/lib/api-client";
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

type DisputesTableMeta = {
	onResolve?: (dispute: Dispute) => void;
	onViewEvidence?: (dispute: Dispute) => void;
};

export const columns: ColumnDef<Dispute>[] = [
	{
		id: "priority",
		header: "",
		cell: ({ row }) => {
			const dispute = row.original;
			if (dispute.category === "ivt" && dispute.status === "open") {
				return <AlertTriangle className="h-4 w-4 text-red-500" />;
			}
			return null;
		},
	},
	{
		id: "hire",
		accessorFn: (row) => row.hire?.listing?.domain?.fqdn ?? row.hireId,
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
			const dispute = row.original;
			const domain = dispute.hire?.listing?.domain?.fqdn ?? dispute.hireId ?? "N/A";
			return <span className="font-medium">{domain}</span>;
		},
	},
	{
		accessorKey: "claimantRole",
		header: "Filed By",
		cell: ({ row }) => {
			const role = row.getValue("claimantRole") as Dispute["claimantRole"];
			const displayRole = role === "hirer" ? "Hirer" : role.charAt(0).toUpperCase() + role.slice(1);
			return (
				<Badge variant={role === "owner" ? "default" : "secondary"}>
					{displayRole}
				</Badge>
			);
		},
	},
	{
		accessorKey: "category",
		header: "Category",
		cell: ({ row }) => {
			const category = row.getValue("category") as string | null;
			let variant: React.ComponentProps<typeof Badge>["variant"] = "secondary";
			if (category === "ivt") {
				variant = "destructive";
			} else if (category === "billing") {
				variant = "outline";
			}
			return (
				<Badge variant={variant}>
					{category ? category.toUpperCase() : "Uncategorized"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const status = row.getValue("status") as Dispute["status"];
			let variant: React.ComponentProps<typeof Badge>["variant"] = "secondary";
			let icon = null;
			if (status === "open") {
				variant = "secondary";
			} else if (status === "investigating") {
				variant = "default";
			} else if (status === "resolved") {
				variant = "default";
				icon = <CheckCircle className="h-3 w-3 mr-1 text-green-500" />;
			} else if (status === "rejected") {
				variant = "outline";
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
		accessorKey: "creditAmountCents",
		header: "Credit",
		cell: ({ row }) => {
			const amount = row.getValue("creditAmountCents") as number | null;
			if (amount === null) return "—";
			const formatter = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
				minimumFractionDigits: 2,
			});
			return formatter.format(amount / 100);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Filed",
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string;
			return format(new Date(date), "MMM dd, yyyy");
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row, table }) => {
			const dispute = row.original;
			const meta = table.options.meta as DisputesTableMeta | undefined;
			const onResolve = meta?.onResolve;
			const onViewEvidence = meta?.onViewEvidence;
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem onSelect={() => onViewEvidence?.(dispute)}>
							View details
						</DropdownMenuItem>
						{(dispute.status === "open" || dispute.status === "investigating") && (
							<DropdownMenuItem onSelect={() => onResolve?.(dispute)}>
								Resolve
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							View hire
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];

