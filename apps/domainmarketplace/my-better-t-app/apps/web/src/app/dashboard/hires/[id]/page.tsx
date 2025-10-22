"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { getRental, type Rental } from "@/lib/api-client";
import { AbuseReportForm } from "@/components/disputes/abuse-report-form";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import {
	Card,
	CardContent,
	CardDescription,
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

function formatDate(value: string | null) {
	if (!value) return "N/A";
	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));
}

export default function RentalDetailPage() {
	const params = useParams();
	const rentalId = params?.id as string | undefined;
	const [isDisputeOpen, setIsDisputeOpen] = React.useState(false);

	const {
		data,
		isLoading,
		isError,
		error,
	} = useQuery<Rental>({
		queryKey: ["rental", rentalId],
		queryFn: () => getRental(rentalId!),
		enabled: Boolean(rentalId),
	});

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-8 w-1/3" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-4 w-1/2" />
					<Skeleton className="h-4 w-1/3" />
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive" className="max-w-xl">
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Unable to load rental</AlertTitle>
				<AlertDescription>
					{error instanceof Error
						? error.message
						: "This rental may not exist or you do not have permission to view it."}
				</AlertDescription>
			</Alert>
		);
	}

	const { listing } = data;
	const domainLabel = listing?.domain?.fqdn ?? data.listingId;

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-6">
				<Button variant="ghost" asChild>
					<Link href="/dashboard/rentals">← Back to rentals</Link>
				</Button>
			<Card>
				<CardHeader className="flex flex-col gap-2">
					<CardTitle>Rental Details</CardTitle>
					<CardDescription>Manage your domain rental lifecycle.</CardDescription>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary" className="capitalize">
							{data.type === "period" ? "Monthly" : "Per click"}
						</Badge>
						<Badge
							variant={
								data.status === "active"
									? "default"
									: data.status === "ended"
										? "secondary"
										: "destructive"
							}
							className="capitalize"
						>
							{data.status}
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="grid gap-6 md:grid-cols-2">
					<div className="space-y-2">
						<h3 className="text-sm font-semibold uppercase text-muted-foreground">
							Domain
						</h3>
						<p className="text-lg font-medium">
							<Link href={`/browse/${data.listingId}`}>{domainLabel}</Link>
						</p>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-semibold uppercase text-muted-foreground">
							Listing mode
						</h3>
						<p className="capitalize">{listing?.mode ?? "Unknown"}</p>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-semibold uppercase text-muted-foreground">
							Start date
						</h3>
						<p>{formatDate(data.startAt)}</p>
					</div>
					<div className="space-y-2">
						<h3 className="text-sm font-semibold uppercase text-muted-foreground">
							End date
						</h3>
						<p>{data.status === "active" && !data.endAt ? "Active" : formatDate(data.endAt)}</p>
					</div>
				</CardContent>
				<CardFooter className="flex flex-wrap gap-2">
					<Button asChild>
						<Link href={`/dashboard/rentals/${data.id}/routes`}>
							Configure routes
						</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link href={`/dashboard/rentals/${data.id}/analytics`}>
							View analytics
						</Link>
					</Button>
					<Button variant="outline" onClick={() => setIsDisputeOpen(true)}>
						Report Issue
					</Button>
					<Button variant="ghost" disabled>
						Cancel rental (coming soon)
					</Button>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Route Configuration</CardTitle>
					<CardDescription>
						Configure URL redirects for this rental.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					<p>
						Set where visitors are sent when they browse {domainLabel}. Create multiple
						routes to support campaign landing pages, microsites, and localized experiences.
					</p>
				</CardContent>
				<CardFooter>
					<Button asChild>
						<Link href={`/dashboard/rentals/${data.id}/routes`}>
							Configure routes
						</Link>
					</Button>
				</CardFooter>
			</Card>

			{data && (
				<AbuseReportForm
					isOpen={isDisputeOpen}
					onOpenChange={setIsDisputeOpen}
					rental={data}
					onSuccess={() => {
						setIsDisputeOpen(false);
						toast.success("Dispute filed successfully");
					}}
				/>
			)}
			</div>
		</div>
	);
}


