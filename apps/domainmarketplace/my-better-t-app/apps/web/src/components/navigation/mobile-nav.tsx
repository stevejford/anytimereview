"use client";

import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Menu,
	Home,
	Search,
	DollarSign,
	Info,
	LayoutDashboard,
	Globe,
	FileText,
	Shield,
	AlertTriangle,
	Users,
	Activity,
	Heart,
	MessageSquare,
	PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { useMode } from "@/lib/hooks/use-mode";
import { ModeSwitcher } from "./mode-switcher";

export default function MobileNav() {
	const { isLoaded, user } = useUser();
	const { signOut } = useClerk();
	const [open, setOpen] = useState(false);
	const { mode, isBrowseMode, isHostMode, canAccessHostMode, hasCompletedOnboarding } = useMode();

	const userEmail = user?.emailAddresses[0]?.emailAddress;
	const userName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : null;

	const handleLinkClick = () => {
		setOpen(false);
	};

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild className="md:hidden">
				<Button variant="ghost" size="icon" aria-label="Open navigation menu">
					<Menu className="h-5 w-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="w-[280px]">
				<SheetHeader>
					<SheetTitle>Navigation</SheetTitle>
				</SheetHeader>

				<div className="mt-6 flex flex-col space-y-4">
					{/* User info if authenticated */}
					{user && (
						<>
							<div className="rounded-lg bg-muted p-3">
								<p className="text-sm font-medium">{userName || "User"}</p>
								<p className="text-xs text-muted-foreground">{userEmail}</p>
							</div>
							<Separator />
						</>
					)}

					{/* Mode Switcher if user has completed onboarding */}
					{canAccessHostMode && (
						<>
							<ModeSwitcher />
							<Separator />
						</>
					)}

					{/* List your domain CTA if user hasn't completed onboarding */}
					{user && !hasCompletedOnboarding && (
						<>
							<Link href="/list-your-domain" onClick={handleLinkClick}>
								<Button variant="default" className="w-full">
									<PlusCircle className="mr-2 h-4 w-4" />
									List your domain
								</Button>
							</Link>
							<Separator />
						</>
					)}

					{/* Public section */}
					<div className="space-y-2">
						<h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
							Explore
						</h3>
						<Link href="/" onClick={handleLinkClick}>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
								size="sm"
							>
								<Home className="mr-2 h-4 w-4" />
								Home
							</Button>
						</Link>
						<Link href="/browse" onClick={handleLinkClick}>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
								size="sm"
							>
								<Search className="mr-2 h-4 w-4" />
								Browse
							</Button>
						</Link>
						<Link href="/pricing" onClick={handleLinkClick}>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
								size="sm"
							>
								<DollarSign className="mr-2 h-4 w-4" />
								Pricing
							</Button>
						</Link>
						<Link href="/about" onClick={handleLinkClick}>
							<Button
								variant="ghost"
								className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
								size="sm"
							>
								<Info className="mr-2 h-4 w-4" />
								About
							</Button>
						</Link>
					</div>

					{/* Browse Mode section */}
					{isBrowseMode && user && (
						<>
							<Separator />
							<div className="space-y-2">
								<h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
									My Account
								</h3>
								<Link href="/hires" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Activity className="mr-2 h-4 w-4" />
										My Hires
									</Button>
								</Link>
								{/* Future features - commented out
								<Link href="/saved" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Heart className="mr-2 h-4 w-4" />
										Saved
									</Button>
								</Link>
								<Link href="/messages" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<MessageSquare className="mr-2 h-4 w-4" />
										Messages
									</Button>
								</Link>
								*/}
							</div>
						</>
					)}

					{/* Host Mode section */}
					{isHostMode && user && (
						<>
							<Separator />
							<div className="space-y-2">
								<h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
									Manage Listings
								</h3>
								<Link href="/host/dashboard" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<LayoutDashboard className="mr-2 h-4 w-4" />
										Dashboard
									</Button>
								</Link>
								<Link href="/host/listings" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<FileText className="mr-2 h-4 w-4" />
										Listings
									</Button>
								</Link>
								<Link href="/host/domains" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Globe className="mr-2 h-4 w-4" />
										Domains
									</Button>
								</Link>
								<Link href="/host/earnings" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<DollarSign className="mr-2 h-4 w-4" />
										Earnings
									</Button>
								</Link>
								{/* Future feature - commented out
								<Link href="/host/calendar" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Calendar className="mr-2 h-4 w-4" />
										Calendar
									</Button>
								</Link>
								*/}
							</div>
						</>
					)}

				{/* Admin section (admin users only) */}
				{user?.publicMetadata?.role === "admin" && (
						<>
							<Separator />
							<div className="space-y-2">
								<h3 className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
									Admin
								</h3>
								<Link href="/admin" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Shield className="mr-2 h-4 w-4" />
										Dashboard
									</Button>
								</Link>
								<Link href="/admin/disputes" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<AlertTriangle className="mr-2 h-4 w-4" />
										Disputes
									</Button>
								</Link>
								<Link href="/admin/users" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<Users className="mr-2 h-4 w-4" />
										Users
									</Button>
								</Link>
								<Link href="/admin/listings" onClick={handleLinkClick}>
									<Button
										variant="ghost"
										className="w-full justify-start hover:bg-secondary/10 hover:text-secondary data-[active]:bg-primary/10 data-[active]:text-primary"
										size="sm"
									>
										<FileText className="mr-2 h-4 w-4" />
										Listings
									</Button>
								</Link>
							</div>
						</>
					)}

					{/* Sign out button if authenticated */}
					{user && (
						<>
							<Separator />
							<Button
								variant="outline"
								className="w-full"
								onClick={() => {
									signOut();
									handleLinkClick();
								}}
							>
								Sign Out
							</Button>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}


