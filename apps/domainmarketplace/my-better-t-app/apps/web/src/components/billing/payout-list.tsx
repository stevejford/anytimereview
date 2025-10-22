"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Payout } from "@/lib/api-client";

interface PayoutListProps {
	payouts: Payout[];
}

function formatCurrency(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(cents / 100);
}

function getStatusBadgeVariant(
	status: Payout["status"]
): "default" | "secondary" | "destructive" {
	switch (status) {
		case "paid":
			return "default";
		case "pending":
			return "secondary";
		case "failed":
			return "destructive";
		default:
			return "secondary";
	}
}

export default function PayoutList({ payouts }: PayoutListProps) {
	if (payouts.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				No payouts found.
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Amount</TableHead>
						<TableHead>Period</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Transfer ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{payouts.map((payout) => (
						<TableRow key={payout.id}>
							<TableCell className="font-medium">
								{formatCurrency(payout.amountCents)}
							</TableCell>
							<TableCell>
								{payout.periodStart && payout.periodEnd ? (
									<>
										{format(new Date(payout.periodStart), "MMM d")} -{" "}
										{format(new Date(payout.periodEnd), "MMM d, yyyy")}
									</>
								) : (
									"N/A"
								)}
							</TableCell>
							<TableCell>
								<Badge variant={getStatusBadgeVariant(payout.status)}>
									{payout.status}
								</Badge>
							</TableCell>
							<TableCell>
								{format(new Date(payout.createdAt), "MMM d, yyyy")}
							</TableCell>
							<TableCell className="font-mono text-sm text-gray-500">
								{payout.stripeTransferId ?? "N/A"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

