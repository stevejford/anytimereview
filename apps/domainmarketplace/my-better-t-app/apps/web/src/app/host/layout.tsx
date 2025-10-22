"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMode } from "@/lib/hooks/use-mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	LayoutDashboard,
	FileText,
	Globe,
	DollarSign,
	// Calendar, // Commented out until /host/calendar page is implemented
} from "lucide-react";

const hostNavItems = [
	{
		title: "Dashboard",
		href: "/host/dashboard",
		icon: LayoutDashboard,
	},
	{
		title: "Listings",
		href: "/host/listings",
		icon: FileText,
	},
	{
		title: "Domains",
		href: "/host/domains",
		icon: Globe,
	},
	{
		title: "Earnings",
		href: "/host/earnings",
		icon: DollarSign,
	},
	// Commented out until /host/calendar page is implemented
	// {
	// 	title: "Calendar",
	// 	href: "/host/calendar",
	// 	icon: Calendar,
	// },
];

export default function HostLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { user, isLoaded } = useUser();
	const { isHostMode, hasCompletedOnboarding } = useMode();

	useEffect(() => {
		if (isLoaded) {
			// Redirect to onboarding if user hasn't completed it
			if (!hasCompletedOnboarding) {
				router.push("/list-your-domain");
				return;
			}

			// Redirect to browse if not in host mode
			if (!isHostMode) {
				router.push("/browse");
				return;
			}
		}
	}, [isLoaded, hasCompletedOnboarding, isHostMode, router]);

	// Show loading state while checking permissions
	if (!isLoaded || !hasCompletedOnboarding || !isHostMode) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="text-center">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<div className="flex gap-8">
				{/* Sidebar Navigation */}
				<aside className="hidden lg:block w-64 flex-shrink-0">
					<nav className="sticky top-24 space-y-1">
						{hostNavItems.map((item) => {
							const Icon = item.icon;
							// Handle both exact and nested routes (e.g., /host/dashboard and /host/dashboard/analytics)
							const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
									)}
								>
									<Icon className="h-5 w-5" />
									{item.title}
								</Link>
							);
						})}
					</nav>
				</aside>

				{/* Mobile Navigation */}
				<div className="lg:hidden w-full mb-6">
					<div className="flex gap-2 overflow-x-auto pb-2">
						{hostNavItems.map((item) => {
							const Icon = item.icon;
							// Handle both exact and nested routes (e.g., /host/dashboard and /host/dashboard/analytics)
							const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
							return (
								<Link
									key={item.href}
									href={item.href}
									className={cn(
										"flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
									)}
								>
									<Icon className="h-4 w-4" />
									{item.title}
								</Link>
							);
						})}
					</div>
				</div>

				{/* Main Content */}
				<main className="flex-1 min-w-0">{children}</main>
			</div>
		</div>
	);
}

