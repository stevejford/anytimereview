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
import type { Invoice } from "@/lib/api-client";

interface InvoiceListProps {
	invoices: Invoice[];
}

function formatCurrency(cents: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(cents / 100);
}

function getStatusBadgeVariant(
	status: Invoice["status"]
): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "paid":
			return "default";
		case "open":
		case "draft":
			return "secondary";
		case "void":
		case "uncollectible":
			return "destructive";
		default:
			return "outline";
	}
}

export default function InvoiceList({ invoices }: InvoiceListProps) {
	if (invoices.length === 0) {
		return (
			<div className="text-center py-8 text-gray-500">
				No invoices found.
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Type</TableHead>
						<TableHead>Amount</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Date</TableHead>
						<TableHead>Stripe Invoice ID</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{invoices.map((invoice) => (
						<TableRow key={invoice.id}>
							<TableCell className="font-medium">
								<Badge variant="outline">
									{invoice.type === "period" ? "Period" : "Usage"}
								</Badge>
							</TableCell>
							<TableCell>{formatCurrency(invoice.amountCents)}</TableCell>
							<TableCell>
								<Badge variant={getStatusBadgeVariant(invoice.status)}>
									{invoice.status}
								</Badge>
							</TableCell>
							<TableCell>
								{format(new Date(invoice.createdAt), "MMM d, yyyy")}
							</TableCell>
							<TableCell className="font-mono text-sm text-gray-500">
								{invoice.stripeInvoiceId ?? "N/A"}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

