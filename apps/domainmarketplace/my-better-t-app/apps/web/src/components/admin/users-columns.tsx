"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown, Shield, Ban, CheckCircle } from "lucide-react";
import { format } from "date-fns";

import type { User } from "@/lib/api-client";
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

export type AdminUsersTableMeta = {
	onSuspend?: (user: User) => void;
	onUnsuspend?: (user: User) => void;
	onBan?: (user: User) => void;
};

export const columns: ColumnDef<User>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
				className="flex items-center gap-2"
			>
				Name
				<ArrowUpDown className="h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const name = row.getValue("name") as string | null;
			return <span className="font-medium">{name ?? "N/A"}</span>;
		},
	},
	{
		accessorKey: "email",
		header: ({ column }) => (
			<Button
				variant="ghost"
				onClick={() =>
					column.toggleSorting(column.getIsSorted() === "asc")
				}
				className="flex items-center gap-2"
			>
				Email
				<ArrowUpDown className="h-4 w-4" />
			</Button>
		),
		cell: ({ row }) => {
			const email = row.getValue("email") as string;
			return <span>{email}</span>;
		},
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => {
			const role = row.getValue("role") as User["role"];
			let variant: React.ComponentProps<typeof Badge>["variant"] = "outline";
			let icon = null;
			
			if (role === "admin") {
				variant = "default";
				icon = <Shield className="h-3 w-3 mr-1" />;
			} else if (role === "owner") {
				variant = "secondary";
			}
			
			return (
				<Badge variant={variant} className="flex items-center w-fit">
					{icon}
					{role.charAt(0).toUpperCase() + role.slice(1)}
				</Badge>
			);
		},
	},
	{
		id: "status",
		header: "Status",
		cell: ({ row }) => {
			const user = row.original;
			
			if (user.bannedAt) {
				return (
					<Badge variant="destructive" className="flex items-center w-fit">
						<Ban className="h-3 w-3 mr-1" />
						Banned
					</Badge>
				);
			}
			
			if (user.suspended) {
				return (
					<Badge variant="secondary">
						Suspended
					</Badge>
				);
			}
			
			return (
				<Badge variant="default" className="flex items-center w-fit">
					Active
				</Badge>
			);
		},
	},
	{
		id: "connect",
		header: "Connect",
		cell: ({ row }) => {
			const user = row.original;
			
			if (user.stripeConnectOnboardingComplete) {
				return (
					<Badge variant="default" className="flex items-center w-fit">
						<CheckCircle className="h-3 w-3 mr-1 text-green-500" />
						Connected
					</Badge>
				);
			}
			
			return (
				<Badge variant="outline">
					Not Connected
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: "Joined",
		cell: ({ row }) => {
			const date = row.getValue("createdAt") as string;
			return format(new Date(date), "MMM dd, yyyy");
		},
	},
	{
		id: "actions",
		header: "",
		cell: ({ row, table }) => {
			const user = row.original;
			const meta = table.options.meta as AdminUsersTableMeta | undefined;
			const onSuspend = meta?.onSuspend;
			const onUnsuspend = meta?.onUnsuspend;
			const onBan = meta?.onBan;
			
			const isBanned = !!user.bannedAt;
			const isSuspended = user.suspended;
			
			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon">
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						{!isSuspended && !isBanned && (
							<DropdownMenuItem onSelect={() => onSuspend?.(user)}>
								Suspend
							</DropdownMenuItem>
						)}
						{isSuspended && !isBanned && (
							<DropdownMenuItem onSelect={() => onUnsuspend?.(user)}>
								Unsuspend
							</DropdownMenuItem>
						)}
						{!isBanned && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem 
									onSelect={() => onBan?.(user)}
									className="text-red-600"
								>
									Ban permanently
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];


