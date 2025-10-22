"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Settings, CreditCard, LogOut } from "lucide-react";

export default function UserMenu() {
	const router = useRouter();
	const { isLoaded, isSignedIn, user } = useUser();
	const { signOut } = useClerk();

	if (!isLoaded) {
		return <Skeleton className="h-9 w-9 rounded-full" />;
	}

	if (!isSignedIn) {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	// Get user initials for avatar fallback
	const getInitials = (name?: string | null, email?: string | null) => {
		const displayName = name || email || "U";
		return displayName
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const userEmail = user.emailAddresses[0]?.emailAddress;
	const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-9 w-9 rounded-full">
					<Avatar className="h-9 w-9">
						<AvatarImage
							src={user.imageUrl || undefined}
							alt={userName || userEmail || "User"}
						/>
						<AvatarFallback>{getInitials(userName, userEmail)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56 bg-card" align="end">
				<DropdownMenuLabel>
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">
							{userName || "User"}
						</p>
						<p className="text-xs leading-none text-muted-foreground">
							{userEmail}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/dashboard/profile" className="flex items-center">
						<User className="mr-2 h-4 w-4" />
						Profile
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/dashboard/settings" className="flex items-center">
						<Settings className="mr-2 h-4 w-4" />
						Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/dashboard/billing" className="flex items-center">
						<CreditCard className="mr-2 h-4 w-4" />
						Billing
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex items-center text-destructive focus:text-destructive"
					onClick={() => {
						signOut(() => router.push("/"));
					}}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
