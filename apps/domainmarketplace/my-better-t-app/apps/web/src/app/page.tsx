"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getPublicListings } from "@/lib/api-client";
import { useMode } from "@/lib/hooks/use-mode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Zap,
	DollarSign,
	BarChart3,
	Shield,
	ArrowRight,
	CheckCircle,
	Search,
	Globe,
	CheckCircle2,
} from "lucide-react";

export default function Home() {
	const router = useRouter();
	const { isSignedIn } = useUser();
	const { hasCompletedOnboarding } = useMode();
	const [searchQuery, setSearchQuery] = React.useState("");

	// Fetch featured listings
	const { data: featuredListings, isLoading: featuredLoading } = useQuery({
		queryKey: ["featured-listings"],
		queryFn: () => getPublicListings({ status: "active", limit: 6 }),
	});

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	return (
		<main className="flex flex-col">
			{/* Hero Section */}
			<section className="container mx-auto max-w-7xl px-4 py-16 md:py-24">
				<div className="mx-auto max-w-4xl text-center">
					<h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
						Discover Premium Domains for Your Next Campaign
					</h1>
					<p className="mb-8 text-xl text-muted-foreground md:text-2xl">
						Browse thousands of high-authority domains available for hire. Find
						the perfect match for your brand.
					</p>

					{/* Search Bar */}
					<form onSubmit={handleSearch} className="mb-6">
						<div className="relative mx-auto max-w-2xl">
							<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search domains (e.g., tech, finance, premium.com)..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="h-14 pl-12 pr-4 text-lg focus-visible:ring-primary"
							/>
						</div>
					</form>

					{/* Quick Filter Chips */}
					<div className="mb-6 flex flex-wrap justify-center gap-2">
						<Badge
							variant="outline"
							className="cursor-pointer hover:border-primary hover:bg-primary/10 hover:text-primary"
							asChild
						>
							<Link href="/browse?mode=exclusive">Exclusive Domains</Link>
						</Badge>
						<Badge
							variant="outline"
							className="cursor-pointer hover:border-primary hover:bg-primary/10 hover:text-primary"
							asChild
						>
							<Link href="/browse?mode=shared_slugs">Shared Slugs</Link>
						</Badge>
						<Badge
							variant="outline"
							className="cursor-pointer hover:border-primary hover:bg-primary/10 hover:text-primary"
							asChild
						>
							<Link href="/browse?priceMax=100">Under $100/mo</Link>
						</Badge>
						<Badge
							variant="outline"
							className="cursor-pointer hover:border-primary hover:bg-primary/10 hover:text-primary"
							asChild
						>
							<Link href="/browse?verified=true">Verified Only</Link>
						</Badge>
					</div>

					{/* Conditional CTA */}
					<div className="mt-6">
						{!isSignedIn ? (
							<Button asChild size="lg">
								<Link href="/list-your-domain">
									List Your Domain <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						) : !hasCompletedOnboarding ? (
							<Button asChild size="lg">
								<Link href="/list-your-domain">
									List Your Domain <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						) : (
							<Button asChild size="lg">
								<Link href="/host/dashboard">
									Switch to Host Mode <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						)}
					</div>
				</div>
			</section>

			{/* Featured Domains Section */}
			<section className="container mx-auto max-w-7xl px-4 py-16">
				<h2 className="mb-8 text-3xl font-bold">Featured Domains</h2>

				{featuredLoading ? (
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{[...Array(6)].map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className="h-6 w-3/4" />
								</CardHeader>
								<CardContent>
									<Skeleton className="mb-2 h-4 w-1/2" />
									<Skeleton className="h-8 w-1/3" />
								</CardContent>
								<CardFooter>
									<Skeleton className="h-10 w-full" />
								</CardFooter>
							</Card>
						))}
					</div>
				) : featuredListings && featuredListings.length > 0 ? (
					<>
						<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
							{featuredListings.map((listing) => (
								<Card
									key={listing.id}
									className="group relative transition-all duration-200 hover:border-primary hover:shadow-lg"
								>
									{/* Featured Badge */}
									<Badge
										variant="destructive"
										className="absolute right-4 top-4 z-10"
									>
										Featured
									</Badge>

									<CardHeader>
										<div className="flex items-center gap-2">
											<Globe className="h-5 w-5 text-primary" />
											<CardTitle className="text-xl">
												{listing.domain.fqdn}
											</CardTitle>
										</div>
										{listing.domain.verificationStatus === "verified" && (
											<Badge variant="default" className="mt-2 w-fit gap-1">
												<CheckCircle2 className="h-3 w-3" />
												Verified
											</Badge>
										)}
									</CardHeader>

									<CardContent className="space-y-3">
										<Badge
											variant={
												listing.mode === "exclusive" ? "default" : "secondary"
											}
										>
											{listing.mode === "exclusive"
												? "Exclusive"
												: "Shared Slugs"}
										</Badge>

										<div>
											{listing.pricePeriodCents ? (
												<p className="text-2xl font-bold text-primary">
													${(listing.pricePeriodCents / 100).toFixed(2)}/month
												</p>
											) : listing.priceClickCents ? (
												<p className="text-2xl font-bold text-primary">
													${(listing.priceClickCents / 100).toFixed(2)} per
													click
												</p>
											) : (
												<p className="text-2xl font-bold text-primary">
													Contact for pricing
												</p>
											)}
										</div>
									</CardContent>

									<CardFooter>
										<Button asChild className="w-full">
											<Link href={`/browse/${listing.id}`}>View Details</Link>
										</Button>
									</CardFooter>
								</Card>
							))}
						</div>

						<div className="mt-8 text-center">
							<Button asChild variant="outline" size="lg">
								<Link href="/browse">
									Browse All Domains <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
						</div>
					</>
				) : (
					<p className="text-center text-muted-foreground">
						Featured domains coming soon
					</p>
				)}
			</section>

			{/* Features Section */}
			<section id="features" className="border-t bg-muted/50 py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						Why Choose HireADomain?
					</h2>
					<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
						{/* Feature 1 */}
						<Card className="hover:border-primary/50">
							<CardHeader>
								<Zap className="mb-2 h-10 w-10 text-primary" />
								<CardTitle>Instant Discovery</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Search and filter thousands of premium domains. Find the
									perfect match for your campaign in seconds.
								</p>
							</CardContent>
						</Card>

						{/* Feature 2 */}
						<Card className="hover:border-primary/50">
							<CardHeader>
								<DollarSign className="mb-2 h-10 w-10 text-primary" />
								<CardTitle>Flexible Pricing</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Choose monthly hires or pay-per-click. Transparent fees, no
									hidden costs. Cancel anytime.
								</p>
							</CardContent>
						</Card>

						{/* Feature 3 */}
						<Card className="hover:border-primary/50">
							<CardHeader>
								<BarChart3 className="mb-2 h-10 w-10 text-primary" />
								<CardTitle>Advanced Analytics</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Real-time click tracking with bot filtering. Geo insights,
									device breakdowns, and CSV exports.
								</p>
							</CardContent>
						</Card>

						{/* Feature 4 */}
						<Card className="hover:border-primary/50">
							<CardHeader>
								<Shield className="mb-2 h-10 w-10 text-primary" />
								<CardTitle>Secure Payments</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Stripe Connect integration, automated payouts, dispute
									protection, and IVT credits.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						How It Works
					</h2>
					<div className="grid gap-12 lg:grid-cols-2">
						{/* For Owners */}
						<div>
							<h3 className="mb-6 text-2xl font-semibold">For Domain Owners</h3>
							<div className="space-y-4">
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">1. Connect Stripe</h4>
										<p className="text-sm text-muted-foreground">
											Complete KYC verification to receive automated payouts.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">2. Add & Verify Domain</h4>
										<p className="text-sm text-muted-foreground">
											Use Domain Connect, TXT records, or HTTP validation.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">3. Configure DNS</h4>
										<p className="text-sm text-muted-foreground">
											Point your domain with CNAME/ALIAS for zero-downtime
											cutover.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">4. Set Pricing & Publish</h4>
										<p className="text-sm text-muted-foreground">
											Choose exclusive or shared slug mode, set your rates, and
											go live.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* For Hirers */}
						<div>
							<h3 className="mb-6 text-2xl font-semibold">For Hirers</h3>
							<div className="space-y-4">
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">1. Discover Domains</h4>
										<p className="text-sm text-muted-foreground">
											Search and filter thousands of premium domains to find
											your perfect match.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">2. Compare & Select</h4>
										<p className="text-sm text-muted-foreground">
											View pricing, verification status, and domain metrics to
											make informed decisions.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">3. Hire & Configure</h4>
										<p className="text-sm text-muted-foreground">
											Secure checkout and instant route setup. Choose 302/301
											redirects and validate links.
										</p>
									</div>
								</div>
								<div className="flex gap-4">
									<CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-primary" />
									<div>
										<h4 className="font-medium">4. Track Performance</h4>
										<p className="text-sm text-muted-foreground">
											Monitor clicks and conversions in real-time with advanced
											analytics and bot filtering.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Social Proof Section */}
			<section className="border-t bg-muted/50 py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						Trusted by Marketers
					</h2>
					<div className="grid gap-8 md:grid-cols-3">
						<Card className="hover:border-primary/50">
							<CardContent className="pt-6 text-center">
								<p className="mb-2 text-4xl font-bold text-primary">5,000+</p>
								<p className="text-muted-foreground">Domains Available</p>
							</CardContent>
						</Card>
						<Card className="hover:border-primary/50">
							<CardContent className="pt-6 text-center">
								<p className="mb-2 text-4xl font-bold text-primary">50M+</p>
								<p className="text-muted-foreground">Clicks Tracked</p>
							</CardContent>
						</Card>
						<Card className="hover:border-primary/50">
							<CardContent className="pt-6 text-center">
								<p className="mb-2 text-4xl font-bold text-primary">99.9%</p>
								<p className="text-muted-foreground">Uptime Guarantee</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section className="py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="mx-auto max-w-2xl text-center">
						<h2 className="mb-4 text-3xl font-bold">Start Browsing Today</h2>
						<p className="mb-8 text-lg text-muted-foreground">
							Discover thousands of premium domains ready to power your next
							campaign. Find your perfect match in minutes.
						</p>
						<div className="flex flex-col justify-center gap-4 sm:flex-row">
							<Button asChild size="lg">
								<Link href="/browse">
									Browse Domains <ArrowRight className="ml-2 h-4 w-4" />
								</Link>
							</Button>
							<Button asChild variant="outline" size="lg">
								<Link href="/pricing">View Pricing</Link>
							</Button>
							{!isSignedIn && (
								<Button asChild variant="outline" size="lg">
									<Link href="/list-your-domain">List Your Domain</Link>
								</Button>
							)}
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
