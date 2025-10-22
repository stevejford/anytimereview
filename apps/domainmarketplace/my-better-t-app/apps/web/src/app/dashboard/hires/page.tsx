"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getRentals, type Rental } from "@/lib/api-client";
import { columns } from "@/components/rentals/columns";
import { DataTable } from "@/components/listings/data-table";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import EmptyState from "@/components/empty-state";
import { ShoppingCart } from "lucide-react";

type StatusFilter = "all" | "active" | "ended" | "suspended";

export default function RentalsDashboardPage() {
	const [status, setStatus] = useState<StatusFilter>("all");

	const {
		data,
		isLoading,
		isError,
	} = useQuery<Rental[]>({
		queryKey: ["rentals", status],
		queryFn: () =>
			status === "all"
				? getRentals()
				: getRentals({ status }),
	});

	const counts = data?.reduce<Record<Exclude<StatusFilter, "all">, number>>(
		(acc, rental) => ({
			...acc,
			[rental.status]: (acc[rental.status as Exclude<StatusFilter, "all">] ?? 0) + 1,
		}),
		{ active: 0, ended: 0, suspended: 0 },
	);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="mb-2 text-3xl font-bold">My Rentals</h1>
						<p className="text-muted-foreground">
						Manage your active domain rentals and routing.
					</p>
				</div>
				<Button variant="outline" asChild>
					<Link href="/browse">Browse listings</Link>
				</Button>
			</div>

			<Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
				<TabsList>
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="active">
						Active
						{counts && <Badge className="ml-2 bg-primary/10 text-primary">{counts.active}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="ended">
						Ended
						{counts && <Badge className="ml-2 bg-muted text-foreground">{counts.ended}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="suspended">
						Suspended
						{counts && <Badge className="ml-2 bg-destructive/10 text-destructive">{counts.suspended}</Badge>}
					</TabsTrigger>
				</TabsList>
				<TabsContent value={status} className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Rentals</CardTitle>
							<CardDescription>Keep track of your rental agreements.</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="space-y-4">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : isError ? (
								<div className="text-sm text-destructive">
									Unable to load rentals. Please try again later.
								</div>
							) : data && data.length > 0 ? (
								<DataTable columns={columns} data={data} />
							) : (
								<EmptyState
									icon={<ShoppingCart />}
									title="No rentals yet"
									description="Browse listings to find the perfect domain for your campaign and start driving traffic."
									action={{
										label: 'Browse Listings',
										href: '/browse',
									}}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
			</div>
		</div>
	);
}



