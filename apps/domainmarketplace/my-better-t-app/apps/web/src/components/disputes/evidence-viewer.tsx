"use client";

import * as React from "react";
import { format } from "date-fns";

import type { Dispute } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EvidenceViewerProps {
	dispute: Dispute;
}

export function EvidenceViewer({ dispute }: EvidenceViewerProps) {
	const [activeTab, setActiveTab] = React.useState<"details" | "hire" | "timeline">("details");

	return (
		<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
			<TabsList>
				<TabsTrigger value="details">Details</TabsTrigger>
				<TabsTrigger value="hire">Hire</TabsTrigger>
				<TabsTrigger value="timeline">Timeline</TabsTrigger>
			</TabsList>

			<TabsContent value="details" className="mt-4">
				<Card>
					<CardHeader>
						<CardTitle>Dispute Details</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<span className="font-semibold">ID:</span> {dispute.id}
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold">Status:</span>
							<Badge
								variant={
									dispute.status === "open"
										? "secondary"
										: dispute.status === "investigating"
											? "default"
											: dispute.status === "resolved"
												? "default"
												: "outline"
								}
							>
								{dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1)}
							</Badge>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold">Category:</span>
							<Badge
								variant={
									dispute.category === "ivt"
										? "destructive"
										: dispute.category === "billing"
											? "outline"
											: "secondary"
								}
							>
								{dispute.category ? dispute.category.toUpperCase() : "Uncategorized"}
							</Badge>
						</div>
						<div>
							<span className="font-semibold">Claimant Role:</span>{" "}
							{dispute.claimantRole.charAt(0).toUpperCase() + dispute.claimantRole.slice(1)}
						</div>
						<div>
							<span className="font-semibold">Reason:</span>
							<p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
								{dispute.reason}
							</p>
						</div>
						{dispute.creditAmountCents && (
							<div>
								<span className="font-semibold">Credit Amount:</span>{" "}
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
									minimumFractionDigits: 2,
								}).format(dispute.creditAmountCents / 100)}
							</div>
						)}
						<div>
							<span className="font-semibold">Filed:</span>{" "}
							{format(new Date(dispute.createdAt), "MMM dd, yyyy 'at' h:mm a")}
						</div>
						{dispute.resolvedAt && (
							<div>
								<span className="font-semibold">Resolved:</span>{" "}
								{format(new Date(dispute.resolvedAt), "MMM dd, yyyy 'at' h:mm a")}
							</div>
						)}
						{dispute.resolvedBy && (
							<div>
								<span className="font-semibold">Resolved By:</span> {dispute.resolvedBy}
							</div>
						)}
						{dispute.resolution && (
							<div>
								<span className="font-semibold">Resolution Notes:</span>
								<p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
									{dispute.resolution}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="hire" className="mt-4">
				<Card>
					<CardHeader>
						<CardTitle>Hire Context</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{dispute.hire ? (
							<>
								<div>
									<span className="font-semibold">Hire ID:</span> {dispute.hire.id}
								</div>
								<div className="flex items-center gap-2">
									<span className="font-semibold">Type:</span>
									<Badge>
										{dispute.hire.type === "per_click" ? "Per-Click" : "Period"}
									</Badge>
								</div>
								<div className="flex items-center gap-2">
									<span className="font-semibold">Status:</span>
									<Badge variant="outline">{dispute.hire.status}</Badge>
								</div>
								<div>
									<span className="font-semibold">Listing Mode:</span>{" "}
									{dispute.hire.listing?.mode === "exclusive"
										? "Exclusive"
										: "Shared Slugs"}
								</div>
								<div>
									<span className="font-semibold">Domain:</span>{" "}
									<span className="font-mono">
										{dispute.hire.listing?.domain?.fqdn ?? "Unknown"}
									</span>
								</div>
							</>
						) : (
							<p className="text-sm text-muted-foreground">
								Hire information not available
							</p>
						)}
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="timeline" className="mt-4">
				<Card>
					<CardHeader>
						<CardTitle>Dispute Timeline</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
									{format(new Date(dispute.createdAt), "MMM dd, yyyy")}
								</div>
								<div>
									<div className="font-semibold">Dispute Created</div>
									<div className="text-sm text-muted-foreground">
										Filed by {dispute.claimantRole}
									</div>
								</div>
							</div>

							{dispute.status === "investigating" && (
								<div className="flex gap-4">
									<div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
										{format(new Date(dispute.updatedAt), "MMM dd, yyyy")}
									</div>
									<div>
										<div className="font-semibold">Under Investigation</div>
										<div className="text-sm text-muted-foreground">
											Status changed to investigating
										</div>
									</div>
								</div>
							)}

							{(dispute.status === "resolved" || dispute.status === "rejected") &&
								dispute.resolvedAt && (
									<div className="flex gap-4">
										<div className="flex-shrink-0 w-24 text-sm text-muted-foreground">
											{format(new Date(dispute.resolvedAt), "MMM dd, yyyy")}
										</div>
										<div>
											<div className="font-semibold">
												{dispute.status === "resolved" ? "Resolved" : "Rejected"}
											</div>
											<div className="text-sm text-muted-foreground">
												{dispute.resolution}
											</div>
										</div>
									</div>
								)}
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
}

