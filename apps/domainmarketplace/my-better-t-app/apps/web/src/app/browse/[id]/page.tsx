"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { type Listing, getListingById } from "@/lib/api-client";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

function formatCurrency(cents: number | null) {
	if (typeof cents !== "number") return null;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export default function ListingDetailPage() {
	const params = useParams();
	const listingId = params?.id as string | undefined;

	const {
		data: listing,
		isLoading,
		isError,
		error,
	} = useQuery<Listing>({
		queryKey: ["listing", listingId],
		queryFn: () => getListingById(listingId!),
		enabled: Boolean(listingId),
	});

	if (isLoading) {
		return (
			<Card className="mx-auto max-w-3xl">
				<CardHeader>
					<Skeleton className="h-8 w-1/2" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-4 w-1/4" />
					<Skeleton className="h-24 w-full" />
				</CardContent>
				<CardFooter>
					<Skeleton className="h-10 w-32" />
				</CardFooter>
			</Card>
		);
	}

	if (isError || !listing) {
		return (
			<Alert variant="destructive" className="max-w-2xl">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Unable to load listing</AlertTitle>
				<AlertDescription>
					{error instanceof Error
						? error.message
						: "Listing may have been removed or you do not have access."}
				</AlertDescription>
			</Alert>
		);
	}

	const periodPrice = formatCurrency(listing.pricePeriodCents);
	const clickPrice = formatCurrency(listing.priceClickCents);
	const isActive = listing.status === "active";

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<Button variant="ghost" asChild>
					<Link href="/browse">← Back to listings</Link>
				</Button>
			<Card className="mx-auto max-w-3xl">
				<CardHeader className="space-y-2">
				<CardTitle className="text-2xl font-semibold">
					{listing.domain?.fqdn ?? listing.domainId}
				</CardTitle>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="capitalize">
							{listing.mode === "exclusive" ? "Exclusive" : "Shared Slugs"}
						</Badge>
						<Badge
							variant={isActive ? "default" : "secondary"}
							className="capitalize"
						>
							{listing.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-6 text-sm">
					<section className="space-y-3">
						<h2 className="text-base font-medium">Availability</h2>
						<p className="text-muted-foreground">
							{listing.mode === "exclusive"
								? "Exclusive hires provide full domain control during the hire period."
								: "Shared slug hires let you map specific routes to your infrastructure."}
						</p>
					</section>
					<section className="space-y-3">
						<h2 className="text-base font-medium">Pricing</h2>
						<ul className="space-y-2">
							{periodPrice && <li>{periodPrice} per month</li>}
							{clickPrice && <li>{clickPrice} per click</li>}
							{!periodPrice && !clickPrice && (
								<li className="text-muted-foreground">
									Contact sales for pricing details.
								</li>
							)}
						</ul>
					</section>
				</CardContent>
				<CardFooter>
					<Button asChild disabled={!isActive}>
						{isActive ? (
							<Link href={`/browse/${listingId}/hire`}>Hire This Domain</Link>
						) : (
							<span>Not Available</span>
						)}
					</Button>
				</CardFooter>
			</Card>
			</div>
		</div>
	);
}


