"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
	Home,
	Search,
	LayoutDashboard,
	Shield,
	FileText,
	Globe,
	AlertTriangle,
	Users,
	DollarSign,
	Activity,
	Heart,
	MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMode } from "@/lib/hooks/use-mode";

export default function MainNav() {
	const { isLoaded, user } = useUser();
	const { mode, isBrowseMode, isHostMode, canAccessHostMode } = useMode();

	return (
		<NavigationMenu className="hidden md:flex">
			<NavigationMenuList>
				{/* Public navigation items */}
				<NavigationMenuItem>
					<NavigationMenuLink asChild>
						<Link
							href="/"
							className={cn(
								"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
							)}
						>
							<Home className="mr-2 h-4 w-4" />
							Home
						</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild>
						<Link
							href="/browse"
							className={cn(
								"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
							)}
						>
							<Search className="mr-2 h-4 w-4" />
							Browse
						</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild>
						<Link
							href="/pricing"
							className={cn(
								"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
							)}
						>
							Pricing
						</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild>
						<Link
							href="/about"
							className={cn(
								"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
							)}
						>
							About
						</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>

				{/* Browse Mode Navigation */}
				{isBrowseMode && user && (
					<>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/hires"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Activity className="mr-2 h-4 w-4" />
									My Hires
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						{/* Future features - commented out
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/saved"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Heart className="mr-2 h-4 w-4" />
									Saved
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/messages"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<MessageSquare className="mr-2 h-4 w-4" />
									Messages
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						*/}
					</>
				)}

				{/* Host Mode Navigation */}
				{isHostMode && user && (
					<>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/host/dashboard"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<LayoutDashboard className="mr-2 h-4 w-4" />
									Dashboard
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/host/listings"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<FileText className="mr-2 h-4 w-4" />
									Listings
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/host/domains"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Globe className="mr-2 h-4 w-4" />
									Domains
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/host/earnings"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<DollarSign className="mr-2 h-4 w-4" />
									Earnings
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						{/* Future feature - commented out
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/host/calendar"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Calendar className="mr-2 h-4 w-4" />
									Calendar
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						*/}
					</>
				)}

			{/* Admin navigation items */}
			{user?.publicMetadata?.role === "admin" && (
					<>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/admin"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Shield className="mr-2 h-4 w-4" />
									Admin
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/admin/disputes"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<AlertTriangle className="mr-2 h-4 w-4" />
									Disputes
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/admin/users"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<Users className="mr-2 h-4 w-4" />
									Users
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem>
							<NavigationMenuLink asChild>
								<Link
									href="/admin/listings"
									className={cn(
										"group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary/10 hover:text-secondary focus:bg-primary/10 focus:text-primary focus:ring-primary/30 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-primary/10 data-[active]:text-primary"
									)}
								>
									<FileText className="mr-2 h-4 w-4" />
									Listings
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</>
				)}
			</NavigationMenuList>
		</NavigationMenu>
	);
}

