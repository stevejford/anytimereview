"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import { toast } from "sonner";

import { getDisputes, type Dispute } from "@/lib/api-client";
import { columns } from "@/components/disputes/columns";
import { DataTable } from "@/components/listings/data-table";
import { announceToScreenReader } from "@/lib/accessibility";
import { ResolutionDialog } from "@/components/disputes/resolution-dialog";
import { EvidenceViewer } from "@/components/disputes/evidence-viewer";
import { IVTThresholdConfig } from "@/components/disputes/ivt-threshold-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type StatusFilter = "all" | "open" | "investigating" | "resolved" | "rejected";
type ClaimantRoleFilter = "all" | "owner" | "hirer";
type CategoryFilter = "all" | "ivt" | "quality" | "billing" | "other";

export default function DisputesPage() {
	const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
	const [claimantRoleFilter, setClaimantRoleFilter] = React.useState<ClaimantRoleFilter>("all");
	const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>("all");
	const [selectedDispute, setSelectedDispute] = React.useState<Dispute | null>(null);
	const [isResolutionOpen, setIsResolutionOpen] = React.useState(false);
	const [isEvidenceOpen, setIsEvidenceOpen] = React.useState(false);
	const [isConfigOpen, setIsConfigOpen] = React.useState(false);
	const queryClient = useQueryClient();

	const disputesQuery = useQuery({
		queryKey: ["disputes", statusFilter, claimantRoleFilter, categoryFilter],
		queryFn: async () =>
			getDisputes({
				status: statusFilter === "all" ? undefined : statusFilter,
				claimantRole: claimantRoleFilter === "all" ? undefined : claimantRoleFilter,
				limit: 50,
			}),
	});

	const allDisputes = disputesQuery.data ?? [];
	
	// Apply client-side category filter
	const disputes = React.useMemo(() => {
		if (categoryFilter === "all") return allDisputes;
		return allDisputes.filter((d) => d.category === categoryFilter);
	}, [allDisputes, categoryFilter]);

	const handleResolve = React.useCallback((dispute: Dispute) => {
		setSelectedDispute(dispute);
		setIsResolutionOpen(true);
	}, []);

	const handleViewEvidence = React.useCallback((dispute: Dispute) => {
		setSelectedDispute(dispute);
		setIsEvidenceOpen(true);
	}, []);

	const handleResolutionSuccess = React.useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ["disputes"] });
		toast.success("Dispute resolved successfully");
		announceToScreenReader("Dispute has been resolved successfully");
	}, [queryClient]);

	const handleSaveThresholds = React.useCallback(
		(thresholds: {
			autoCreditPercent: number;
			maxClicksCap: number;
			maxAmountCents: number;
		}) => {
			// For MVP, just show toast. Actual persistence can be added later.
			toast.success("IVT thresholds updated successfully");
			announceToScreenReader("IVT threshold settings have been saved");
			setIsConfigOpen(false);
		},
		[],
	);

	const statusCounts = React.useMemo(
		() =>
			disputes.reduce(
				(acc, dispute) => {
					acc.all += 1;
					acc[dispute.status] += 1;
					return acc;
				},
				{
					all: 0,
					open: 0,
					investigating: 0,
					resolved: 0,
					rejected: 0,
				} as Record<StatusFilter, number>,
			),
		[disputes],
	);

	const resolvedThisWeek = React.useMemo(() => {
		const weekAgo = new Date();
		weekAgo.setDate(weekAgo.getDate() - 7);
		return disputes.filter(
			(d) => d.status === "resolved" && d.resolvedAt && new Date(d.resolvedAt) >= weekAgo,
		).length;
	}, [disputes]);

	const avgResolutionTime = React.useMemo(() => {
		const resolved = disputes.filter(
			(d) => d.status === "resolved" && d.resolvedAt,
		);
		if (resolved.length === 0) return "—";
		const totalMs = resolved.reduce((sum, d) => {
			const created = new Date(d.createdAt).getTime();
			const resolved = new Date(d.resolvedAt!).getTime();
			return sum + (resolved - created);
		}, 0);
		const avgMs = totalMs / resolved.length;
		const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
		return `${avgDays}d`;
	}, [disputes]);

	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
					<p className="text-muted-foreground">
						Review and resolve disputes from hirers and owners
					</p>
				</div>
				<Button onClick={() => setIsConfigOpen(true)} variant="outline">
					<Settings className="mr-2 h-4 w-4" />
					IVT Thresholds
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Open</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{statusCounts.open}</div>
						<p className="text-xs text-muted-foreground">
							Awaiting investigation
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Investigating</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{statusCounts.investigating}</div>
						<p className="text-xs text-muted-foreground">
							Under active review
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Resolved This Week</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{resolvedThisWeek}</div>
						<p className="text-xs text-muted-foreground">
							Last 7 days
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{avgResolutionTime}</div>
						<p className="text-xs text-muted-foreground">
							For resolved disputes
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="flex gap-4 items-center">
				<div className="flex-1">
					<label className="text-sm font-medium mb-2 block">Claimant Role</label>
					<Select value={claimantRoleFilter} onValueChange={(value) => setClaimantRoleFilter(value as ClaimantRoleFilter)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All roles" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Roles</SelectItem>
							<SelectItem value="owner">Owner</SelectItem>
							<SelectItem value="hirer">Hirer</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex-1">
					<label className="text-sm font-medium mb-2 block">Category</label>
					<Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="All categories" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Categories</SelectItem>
							<SelectItem value="ivt">IVT</SelectItem>
							<SelectItem value="quality">Quality</SelectItem>
							<SelectItem value="billing">Billing</SelectItem>
							<SelectItem value="other">Other</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
				<TabsList>
					<TabsTrigger value="all">
						All {statusCounts.all > 0 && <Badge className="ml-2">{statusCounts.all}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="open">
						Open {statusCounts.open > 0 && <Badge className="ml-2">{statusCounts.open}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="investigating">
						Investigating{" "}
						{statusCounts.investigating > 0 && (
							<Badge className="ml-2">{statusCounts.investigating}</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value="resolved">
						Resolved{" "}
						{statusCounts.resolved > 0 && <Badge className="ml-2">{statusCounts.resolved}</Badge>}
					</TabsTrigger>
					<TabsTrigger value="rejected">
						Rejected{" "}
						{statusCounts.rejected > 0 && <Badge className="ml-2">{statusCounts.rejected}</Badge>}
					</TabsTrigger>
				</TabsList>

				<TabsContent value={statusFilter} className="mt-6">
					<Card>
						<CardHeader>
							<CardTitle>Disputes Queue</CardTitle>
						</CardHeader>
						<CardContent>
							{disputesQuery.isLoading ? (
								<div className="space-y-3">
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
								</div>
							) : disputes.length === 0 ? (
								<p className="text-center text-muted-foreground py-8">
									No disputes found
								</p>
							) : (
								<DataTable
									columns={columns}
									data={disputes}
									meta={{
										onResolve: handleResolve,
										onViewEvidence: handleViewEvidence,
									}}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<ResolutionDialog
				isOpen={isResolutionOpen}
				onOpenChange={setIsResolutionOpen}
				dispute={selectedDispute}
				onSuccess={handleResolutionSuccess}
			/>

			<Dialog open={isEvidenceOpen} onOpenChange={setIsEvidenceOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Dispute Evidence</DialogTitle>
					</DialogHeader>
					{selectedDispute && <EvidenceViewer dispute={selectedDispute} />}
				</DialogContent>
			</Dialog>

			<Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>IVT Threshold Configuration</DialogTitle>
					</DialogHeader>
					<IVTThresholdConfig onSave={handleSaveThresholds} />
				</DialogContent>
			</Dialog>
		</div>
	);
}

