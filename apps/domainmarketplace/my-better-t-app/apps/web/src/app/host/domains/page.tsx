"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDomains, getDomainStatus, verifyDomain, deleteDomain, getListings } from "@/lib/api-client";
import { DomainWizard } from "@/components/domains/domain-wizard";
import { MetricCard } from "@/components/analytics/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
	Globe,
	CheckCircle2,
	Clock,
	AlertCircle,
	RefreshCw,
	Trash2,
	Settings,
	ExternalLink,
	Copy,
	Shield,
	FileText,
	Plus,
	Wifi,
	Server,
} from "lucide-react";
import { toast } from "sonner";

export default function HostDomainsPage() {
	const queryClient = useQueryClient();
	const [isWizardOpen, setIsWizardOpen] = React.useState(false);
	const [filterStatus, setFilterStatus] = React.useState<string>("all");
	const [sortBy, setSortBy] = React.useState<string>("newest");

	// Fetch domains
	const { data: domains, isLoading, error, refetch } = useQuery({
		queryKey: ["domains"],
		queryFn: getDomains,
	});

	// Fetch listings to count per domain
	const { data: listings } = useQuery({
		queryKey: ["listings"],
		queryFn: getListings,
	});

	// Mutation for retrying verification
	const retryVerificationMutation = useMutation({
		mutationFn: ({ id, method }: { id: string; method: string }) =>
			verifyDomain(id, { method }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["domains"] });
			toast.success("Verification retry started");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to retry verification");
		},
	});

	// Mutation for deleting domain
	const deleteDomainMutation = useMutation({
		mutationFn: (id: string) => deleteDomain(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["domains"] });
			toast.success("Domain deleted successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete domain");
		},
	});

	// Calculate metrics
	const totalDomains = domains?.length || 0;
	const verifiedDomains = domains?.filter((d) => d.verificationStatus === "verified").length || 0;
	const pendingDomains = domains?.filter((d) => d.verificationStatus === "pending").length || 0;

	// Count listings per domain
	const listingsPerDomain = React.useMemo(() => {
		if (!listings) return {};
		return listings.reduce((acc, listing) => {
			const domainId = listing.domainId;
			acc[domainId] = (acc[domainId] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);
	}, [listings]);

	// Filter and sort domains
	const filteredDomains = React.useMemo(() => {
		if (!domains) return [];

		let filtered = domains;

		if (filterStatus !== "all") {
			filtered = filtered.filter((d) => d.verificationStatus === filterStatus);
		}

		// Sort
		filtered = [...filtered].sort((a, b) => {
			if (sortBy === "newest") {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			} else if (sortBy === "oldest") {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			} else if (sortBy === "alphabetical") {
				return a.fqdn.localeCompare(b.fqdn);
			} else if (sortBy === "status") {
				const statusOrder = { verified: 0, pending: 1, failed: 2 };
				return (
					(statusOrder[a.verificationStatus as keyof typeof statusOrder] || 3) -
					(statusOrder[b.verificationStatus as keyof typeof statusOrder] || 3)
				);
			}
			return 0;
		});

		return filtered;
	}, [domains, filterStatus, sortBy]);

	// Copy to clipboard
	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	// Format date
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			{/* Error Handling */}
			{error && (
				<Alert variant="destructive" className="mb-8">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						<div className="flex items-center justify-between">
							<span>Failed to load domains. Please try again.</span>
							<Button variant="outline" size="sm" onClick={() => refetch()}>
								<RefreshCw className="mr-2 h-4 w-4" />
								Retry
							</Button>
						</div>
					</AlertDescription>
				</Alert>
			)}

			{/* Page Header */}
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">My Domains</h1>
					<p className="text-muted-foreground">
						Manage your domains, verification status, and DNS settings
					</p>
				</div>
				<Button variant="default" onClick={() => setIsWizardOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Domain
				</Button>
			</div>

			{/* Metric Cards */}
			{totalDomains > 0 && (
				<div className="mb-8 grid gap-6 md:grid-cols-3">
					{isLoading ? (
						<>
							<Skeleton className="h-32" />
							<Skeleton className="h-32" />
							<Skeleton className="h-32" />
						</>
					) : (
						<>
							<MetricCard
								title="Total Domains"
								value={totalDomains}
								icon={<Globe className="h-5 w-5 text-primary" />}
							/>
							<MetricCard
								title="Verified Domains"
								value={verifiedDomains}
								icon={<CheckCircle2 className="h-5 w-5 text-primary" />}
							/>
							<MetricCard
								title="Pending Verification"
								value={pendingDomains}
								icon={<Clock className="h-5 w-5 text-secondary" />}
							/>
						</>
					)}
				</div>
			)}

			{/* Filters */}
			{totalDomains > 0 && (
				<div className="mb-6 flex gap-4">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Filter: {filterStatus === "all" ? "All" : filterStatus}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => setFilterStatus("all")}>
								All domains
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus("verified")}>
								Verified only
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus("pending")}>
								Pending verification
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setFilterStatus("failed")}>
								Failed verification
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								Sort: {sortBy === "newest" ? "Newest first" : sortBy === "oldest" ? "Oldest first" : sortBy === "alphabetical" ? "Alphabetical" : "By status"}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => setSortBy("newest")}>
								Newest first
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("oldest")}>
								Oldest first
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("alphabetical")}>
								Alphabetical
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setSortBy("status")}>
								By verification status
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}

			{/* Domains List */}
			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-64" />
					<Skeleton className="h-64" />
					<Skeleton className="h-64" />
				</div>
			) : filteredDomains.length === 0 && totalDomains === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<Globe className="mx-auto mb-4 h-16 w-16 text-primary" />
						<h3 className="mb-2 text-xl font-semibold">No domains yet</h3>
						<p className="mb-6 text-muted-foreground">
							Add your first domain to start listing it for hire and earning passive income from your
							premium domains.
						</p>
						<Button variant="default" onClick={() => setIsWizardOpen(true)}>
							<Plus className="mr-2 h-4 w-4" />
							Add Domain
						</Button>
						<p className="mt-4 text-sm text-muted-foreground">
							Domain verification typically takes 5-10 minutes
						</p>
					</CardContent>
				</Card>
			) : filteredDomains.length === 0 ? (
				<Card>
					<CardContent className="py-16 text-center">
						<p className="text-muted-foreground">No domains match the selected filter.</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{filteredDomains.map((domain) => {
						const listingCount = listingsPerDomain[domain.id] || 0;
						return (
							<DomainCard
								key={domain.id}
								domain={domain}
								listingCount={listingCount}
								onDelete={() => {
									if (confirm(`Are you sure you want to delete ${domain.fqdn}?`)) {
										deleteDomainMutation.mutate(domain.id);
									}
								}}
								onRetryVerification={() => {
									retryVerificationMutation.mutate({
										id: domain.id,
										method: domain.verificationMethod || "cf_saas",
									});
								}}
								copyToClipboard={copyToClipboard}
								formatDate={formatDate}
							/>
						);
					})}
				</div>
			)}

			{/* Domain Wizard */}
			<DomainWizard
				open={isWizardOpen}
				onOpenChange={setIsWizardOpen}
				onSuccess={() => {
					queryClient.invalidateQueries({ queryKey: ["domains"] });
					setIsWizardOpen(false);
				}}
			/>
		</div>
	);
}

// Domain Card Component
function DomainCard({
	domain,
	listingCount,
	onDelete,
	onRetryVerification,
	copyToClipboard,
	formatDate,
}: {
	domain: any;
	listingCount: number;
	onDelete: () => void;
	onRetryVerification: () => void;
	copyToClipboard: (text: string) => void;
	formatDate: (date: string) => string;
}) {
	const queryClient = useQueryClient();

	// Per-domain status query with polling for pending domains
	const {
		data: statusData,
		isLoading: statusLoading,
		error: statusError,
		refetch: refetchStatus,
	} = useQuery({
		queryKey: ["domainStatus", domain.id],
		queryFn: () => getDomainStatus(domain.id),
		enabled: domain.verificationStatus === "pending",
		refetchInterval: (query) => {
			const data = query.state.data;
			// Poll every 5 seconds while pending
			if (data?.verificationStatus === "pending") {
				return 5000;
			}
			// Stop polling when verified or failed
			return false;
		},
	});

	// Use status data if available, otherwise fall back to domain prop
	const currentStatus = statusData || domain;

	// Effect to invalidate domains list when status changes from pending
	React.useEffect(() => {
		if (statusData && statusData.verificationStatus !== "pending" && domain.verificationStatus === "pending") {
			queryClient.invalidateQueries({ queryKey: ["domains"] });
		}
	}, [statusData, domain.verificationStatus, queryClient]);

	// Handle retry verification
	const handleRetryVerification = () => {
		onRetryVerification();
		// Re-enable polling after retry
		queryClient.invalidateQueries({ queryKey: ["domainStatus", domain.id] });
	};

	// Handle check status
	const handleCheckStatus = async () => {
		toast.info("Checking domain status...");
		await refetchStatus();
	};

	return (
		<Card className="hover:border-primary">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="mb-2 text-lg">{domain.fqdn}</CardTitle>
						<div className="flex flex-wrap gap-2">
							{currentStatus.verificationStatus === "verified" ? (
								<Badge variant="default" className="gap-1">
									<CheckCircle2 className="h-3 w-3" />
									Verified
								</Badge>
							) : currentStatus.verificationStatus === "pending" ? (
								<Badge variant="secondary" className="gap-1">
									<Clock className="h-3 w-3" />
									Pending {statusLoading && "(checking...)"}
								</Badge>
							) : (
								<Badge variant="destructive" className="gap-1">
									<AlertCircle className="h-3 w-3" />
									Failed
								</Badge>
							)}
							{listingCount > 0 && (
								<Badge variant="outline" className="gap-1">
									<FileText className="h-3 w-3" />
									{listingCount} {listingCount === 1 ? "listing" : "listings"}
								</Badge>
							)}
						</div>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<Settings className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							{domain.verificationMethod && (
								<DropdownMenuItem>
									<ExternalLink className="mr-2 h-4 w-4" />
									View verification instructions
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								<Trash2 className="mr-2 h-4 w-4" />
								Remove domain
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Status error handling */}
				{statusError && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							Failed to check status. Please try again.
						</AlertDescription>
					</Alert>
				)}

				{/* Verification info */}
				{currentStatus.verificationStatus === "verified" && currentStatus.verifiedAt && (
					<p className="text-sm text-muted-foreground">
						Verified on {formatDate(currentStatus.verifiedAt)}
					</p>
				)}

				{/* Health Indicators */}
				{currentStatus.verificationStatus === "verified" && (
					<div className="flex flex-wrap gap-2">
						{currentStatus.sslStatus !== undefined && (
							<Badge variant={currentStatus.sslStatus === "valid" ? "default" : "destructive"} className="gap-1">
								<Shield className="h-3 w-3" />
								SSL {currentStatus.sslStatus === "valid" ? "Valid" : "Invalid"}
							</Badge>
						)}
						{currentStatus.dnsStatus !== undefined && (
							<Badge variant={currentStatus.dnsStatus === "configured" ? "default" : "destructive"} className="gap-1">
								<Wifi className="h-3 w-3" />
								DNS {currentStatus.dnsStatus === "configured" ? "OK" : "Issue"}
							</Badge>
						)}
						{currentStatus.routingStatus !== undefined && (
							<Badge variant={currentStatus.routingStatus === "active" ? "default" : "secondary"} className="gap-1">
								<Server className="h-3 w-3" />
								Routing {currentStatus.routingStatus === "active" ? "Active" : "Inactive"}
							</Badge>
						)}
					</div>
				)}

				{/* CNAME target */}
				{domain.cnameTarget && (
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">CNAME Target:</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
								{domain.cnameTarget}
							</code>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => copyToClipboard(domain.cnameTarget!)}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* TXT record for manual verification */}
				{domain.verificationMethod === "manual" && domain.txtRecord && (
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">TXT Record:</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
								{domain.txtRecord}
							</code>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => copyToClipboard(domain.txtRecord!)}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* HTTP token for HTTP verification */}
				{domain.verificationMethod === "http" && domain.httpToken && (
					<div className="space-y-1">
						<p className="text-xs font-medium text-muted-foreground">HTTP Token:</p>
						<div className="flex items-center gap-2">
							<code className="flex-1 rounded bg-muted px-2 py-1 text-xs">
								{domain.httpToken}
							</code>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => copyToClipboard(domain.httpToken!)}
							>
								<Copy className="h-4 w-4" />
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Place at: /.well-known/domain-verification.txt
						</p>
					</div>
				)}

				{/* Verification instructions for pending */}
				{currentStatus.verificationStatus === "pending" && (
					<Alert>
						<Clock className="h-4 w-4" />
						<AlertTitle className="text-sm">Verification in progress</AlertTitle>
						<AlertDescription className="text-xs">
							This usually takes 5-10 minutes. We're automatically checking the status every 5 seconds.
							{domain.verificationMethod === "cf_saas" && " Make sure your CNAME record is configured correctly."}
							{domain.verificationMethod === "manual" && " Make sure your TXT record is added to your DNS."}
							{domain.verificationMethod === "http" && " Make sure the HTTP token file is accessible."}
						</AlertDescription>
					</Alert>
				)}

				{/* Failed verification troubleshooting */}
				{currentStatus.verificationStatus === "failed" && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle className="text-sm">Verification failed</AlertTitle>
						<AlertDescription className="text-xs space-y-2">
							<p>{currentStatus.verificationError || "Unable to verify domain ownership."}</p>
							<div className="space-y-1">
								<p className="font-medium">Troubleshooting steps:</p>
								<ul className="list-disc list-inside space-y-1">
									<li>Check DNS propagation (may take 24-48 hours)</li>
									<li>Verify your DNS records are correct</li>
									<li>Ensure no conflicting records exist</li>
								</ul>
							</div>
							<Button
								variant="outline"
								size="sm"
								asChild
								className="mt-2"
							>
								<a
									href={`https://dnschecker.org/#CNAME/${domain.fqdn}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink className="mr-2 h-3 w-3" />
									Check DNS Propagation
								</a>
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{/* Action buttons */}
				<div className="flex gap-2">
					{currentStatus.verificationStatus === "pending" && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleCheckStatus}
							disabled={statusLoading}
						>
							<RefreshCw className={`mr-2 h-4 w-4 ${statusLoading ? "animate-spin" : ""}`} />
							Check Status
						</Button>
					)}
					{currentStatus.verificationStatus === "failed" && (
						<Button
							variant="default"
							size="sm"
							onClick={handleRetryVerification}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Retry Verification
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

