"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { getPublicListing, type Listing } from "@/lib/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RenterCheckoutWizard } from "@/components/wizard/renter-checkout-wizard";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import { announceToScreenReader } from "@/lib/accessibility";
import { isSeedListing } from "@/lib/seed-data";
import Link from "next/link";

export default function RentDomainPage() {
	const params = useParams();
	const router = useRouter();
	const listingId = params?.id as string | undefined;

	const {
		data: listing,
		isLoading,
		isError,
		error,
	} = useQuery<Listing>({
		queryKey: ["listing", listingId],
		queryFn: () => getPublicListing(listingId!),
		enabled: Boolean(listingId) && !isSeedListing(listingId as string),
	});

	const handleComplete = (rentalId: string) => {
		announceToScreenReader("Rental created successfully. Redirecting to your rentals dashboard.");
		router.push("/dashboard/rentals");
	};

	// Check if this is a seed listing
	if (listingId && isSeedListing(listingId)) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<Breadcrumbs />
				<Alert className="max-w-2xl border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
					<AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
					<AlertTitle className="text-purple-900 dark:text-purple-100">
						Demo Listing
					</AlertTitle>
					<AlertDescription className="text-purple-800 dark:text-purple-200">
						This is a demo listing. Sign up to browse real domains available for rent.
					</AlertDescription>
					<div className="mt-4 flex gap-2">
						<Button asChild>
							<Link href="/browse">Browse Real Domains</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/list-your-domain">List Your Domain</Link>
						</Button>
					</div>
				</Alert>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<Breadcrumbs />
				<Card className="mx-auto max-w-3xl">
					<CardHeader>
						<Skeleton className="h-8 w-1/2" />
					</CardHeader>
					<CardContent className="space-y-4">
						<Skeleton className="h-4 w-1/3" />
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-24 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isError || !listing) {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<Breadcrumbs />
				<Alert variant="destructive" className="max-w-2xl">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Unable to load listing</AlertTitle>
					<AlertDescription>
						{error instanceof Error
							? error.message
							: "Listing may have been removed or you do not have access."}
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	if (listing.status !== "active") {
		return (
			<div className="container mx-auto max-w-7xl px-4 py-8">
				<Breadcrumbs />
				<Alert variant="destructive" className="max-w-2xl">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Listing not available</AlertTitle>
					<AlertDescription>
						This listing is not currently available for rent.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<RenterCheckoutWizard listing={listing} onComplete={handleComplete} />
		</div>
	);
}


