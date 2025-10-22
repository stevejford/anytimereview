import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { auth } from "@clerk/nextjs/server";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
	TrendingUp,
	DollarSign,
	Activity,
	Globe,
	FileText,
	ShoppingCart,
	ArrowRight,
} from "lucide-react";

export default async function DashboardPage() {
	const { userId } = await auth();

	if (!userId) {
		redirect("/login");
	}

	// For now, pass a minimal session-like object to Dashboard component
	// The actual user data will be fetched via the API as needed
	const session = {
		user: {
			id: userId,
			name: "User", // This could be fetched from the database if needed
		}
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />

			{/* Page Header */}
			<div className="mb-8">
				<h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground">
					Welcome back!
				</p>
			</div>

			{/* Metric Cards */}
			<div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Domains</CardTitle>
						<Globe className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">No domains added yet</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Listings
						</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">
							No active listings
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Active Hires
						</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">0</div>
						<p className="text-xs text-muted-foreground">No active hires</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Recent Activity
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">-</div>
						<p className="text-xs text-muted-foreground">Last 7 days</p>
					</CardContent>
				</Card>
			</div>

			{/* Quick Actions */}
			<div className="mb-8">
				<h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
				<div className="grid gap-4 md:grid-cols-3">
					<Card className="group cursor-pointer transition-colors hover:border-primary">
						<Link href="/dashboard/domains">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-base">
									<span className="flex items-center gap-2">
										<Globe className="h-5 w-5" />
										Add Domain
									</span>
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Add and verify your first domain to start listing
								</p>
							</CardContent>
						</Link>
					</Card>

					<Card className="group cursor-pointer transition-colors hover:border-primary">
						<Link href="/dashboard/listings">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-base">
									<span className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										Create Listing
									</span>
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									List your domain for hire and start earning
								</p>
							</CardContent>
						</Link>
					</Card>

					<Card className="group cursor-pointer transition-colors hover:border-primary">
						<Link href="/browse">
							<CardHeader>
								<CardTitle className="flex items-center justify-between text-base">
									<span className="flex items-center gap-2">
										<ShoppingCart className="h-5 w-5" />
										Browse Listings
									</span>
									<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Find domains for your marketing campaigns
								</p>
							</CardContent>
						</Link>
					</Card>
				</div>
			</div>

			{/* Recent Activity Feed */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-center text-sm text-muted-foreground">
						No recent activity. Get started by adding a domain or browsing
						listings.
					</p>
				</CardContent>
			</Card>

			<Dashboard session={session} />
		</div>
	);
}
