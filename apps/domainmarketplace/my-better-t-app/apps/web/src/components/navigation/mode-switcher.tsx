"use client";

import { useMode } from "@/lib/hooks/use-mode";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Building2, ChevronDown } from "lucide-react";

export function ModeSwitcher() {
	const { mode, isBrowseMode, isHostMode, switchToBrowse, switchToHost, canAccessHostMode } = useMode();
	const { isSignedIn } = useUser();

	// Don't show the switcher if user is not signed in
	if (!isSignedIn) {
		return null;
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="gap-2 text-primary hover:bg-secondary/10 hover:text-secondary"
					aria-label={`Current mode: ${isBrowseMode ? 'Browse' : 'Owner'}`}
				>
					{isBrowseMode ? (
						<>
							<Home className="h-4 w-4" />
							<span className="hidden sm:inline">Browse</span>
						</>
					) : (
						<>
							<Building2 className="h-4 w-4" />
							<span className="hidden sm:inline">Owner</span>
						</>
					)}
					<ChevronDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuLabel>Switch mode</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={switchToBrowse}
					className="gap-2 cursor-pointer hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary data-[disabled]:bg-primary/10 data-[disabled]:text-primary data-[disabled]:opacity-100"
					disabled={isBrowseMode}
				>
					<Home className="h-4 w-4" />
					<div className="flex flex-col">
						<span>Browse mode</span>
						<span className="text-xs text-muted-foreground">
							Find and hire premium domains
						</span>
					</div>
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={switchToHost}
					className="gap-2 cursor-pointer hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary data-[disabled]:bg-primary/10 data-[disabled]:text-primary data-[disabled]:opacity-100"
					disabled={isHostMode}
				>
					<Building2 className="h-4 w-4" />
					<div className="flex flex-col">
						<span>Owner mode</span>
						<span className="text-xs text-muted-foreground">
							{canAccessHostMode
								? "Manage your domain listings and earnings"
								: "Complete onboarding to access"
							}
						</span>
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

