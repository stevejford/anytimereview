"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Ban, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

import {
	getAdminListings,
	getAdminUsers,
	moderateListing,
	moderateUser,
	type Listing,
	type User,
} from "@/lib/api-client";
import { columns as listingsColumns } from "@/components/admin/listings-columns";
import { columns as usersColumns } from "@/components/admin/users-columns";
import { DataTable } from "@/components/listings/data-table";
import { ModerationDialog } from "@/components/admin/moderation-dialog";
import { SystemHealthCard } from "@/components/admin/system-health-card";
import { FinanceOverviewCard } from "@/components/admin/finance-overview-card";
import { AuditLogViewer, type AuditLogEntry } from "@/components/admin/audit-log-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";

type TabValue = "overview" | "listings" | "users";
type ListingsStatusFilter = "all" | "draft" | "active" | "paused";
type UsersRoleFilter = "all" | "owner" | "hirer" | "admin";
type ModerationAction = "approve" | "suspend" | "ban" | "unsuspend";

export default function AdminDashboardPage() {
	const [activeTab, setActiveTab] = React.useState<TabValue>("overview");
	const [listingsStatusFilter, setListingsStatusFilter] = React.useState<ListingsStatusFilter>("all");
	const [usersRoleFilter, setUsersRoleFilter] = React.useState<UsersRoleFilter>("all");
	const [selectedListing, setSelectedListing] = React.useState<Listing | null>(null);
	const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
	const [moderationAction, setModerationAction] = React.useState<ModerationAction | null>(null);
	const [isModerationOpen, setIsModerationOpen] = React.useState(false);
	const [isCommandOpen, setIsCommandOpen] = React.useState(false);
	const [commandSearch, setCommandSearch] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [searchUsers, setSearchUsers] = React.useState<User[]>([]);
	const [isSearching, setIsSearching] = React.useState(false);
	const queryClient = useQueryClient();
	const abortControllerRef = React.useRef<AbortController | null>(null);

	// Queries
	const listingsQuery = useQuery({
		queryKey: ["admin-listings", listingsStatusFilter],
		queryFn: () =>
			getAdminListings({
				status: listingsStatusFilter === "all" ? undefined : listingsStatusFilter,
				limit: 50,
			}),
	});

	const usersQuery = useQuery({
		queryKey: ["admin-users", usersRoleFilter],
		queryFn: () =>
			getAdminUsers({
				role: usersRoleFilter === "all" ? undefined : usersRoleFilter,
				limit: 50,
			}),
	});

	// Mutations
	const moderateListingMutation = useMutation({
		mutationFn: ({ id, status, reason }: { id: string; status: "active" | "paused"; reason?: string }) =>
			moderateListing(id, { status, reason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
			toast.success("Listing moderated successfully");
			setIsModerationOpen(false);
			setSelectedListing(null);
			setModerationAction(null);
		},
		onError: () => {
			toast.error("Failed to moderate listing");
		},
	});

	const moderateUserMutation = useMutation({
		mutationFn: ({ id, action, reason }: { id: string; action: "suspend" | "unsuspend" | "ban"; reason: string }) =>
			moderateUser(id, { action, reason }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-users"] });
			toast.success("User moderated successfully");
			setIsModerationOpen(false);
			setSelectedUser(null);
			setModerationAction(null);
		},
		onError: () => {
			toast.error("Failed to moderate user");
		},
	});

	// Handlers
	const handleApproveListing = React.useCallback((listing: Listing) => {
		setSelectedListing(listing);
		setModerationAction("approve");
		setIsModerationOpen(true);
	}, []);

	const handleSuspendListing = React.useCallback((listing: Listing) => {
		setSelectedListing(listing);
		setModerationAction("suspend");
		setIsModerationOpen(true);
	}, []);

	const handleSuspendUser = React.useCallback((user: User) => {
		setSelectedUser(user);
		setModerationAction("suspend");
		setIsModerationOpen(true);
	}, []);

	const handleUnsuspendUser = React.useCallback((user: User) => {
		setSelectedUser(user);
		setModerationAction("unsuspend");
		setIsModerationOpen(true);
	}, []);

	const handleBanUser = React.useCallback((user: User) => {
		setSelectedUser(user);
		setModerationAction("ban");
		setIsModerationOpen(true);
	}, []);

	const handleModerationConfirm = React.useCallback(
		(reason?: string) => {
			if (selectedListing && moderationAction) {
				if (moderationAction === "approve") {
					moderateListingMutation.mutate({
						id: selectedListing.id,
						status: "active",
						reason,
					});
				} else if (moderationAction === "suspend") {
					moderateListingMutation.mutate({
						id: selectedListing.id,
						status: "paused",
						reason,
					});
				}
			} else if (selectedUser && moderationAction) {
				if (moderationAction === "suspend" || moderationAction === "unsuspend" || moderationAction === "ban") {
					moderateUserMutation.mutate({
						id: selectedUser.id,
						action: moderationAction,
						reason: reason || "",
					});
				}
			}
		},
		[selectedListing, selectedUser, moderationAction, moderateListingMutation, moderateUserMutation],
	);

	// Keyboard shortcut for Command palette
	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setIsCommandOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	// Reset search when closing command palette
	React.useEffect(() => {
		if (!isCommandOpen) {
			setCommandSearch("");
			setDebouncedSearch("");
			setSearchUsers([]);
		}
	}, [isCommandOpen]);

	// Debounce search input
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(commandSearch);
		}, 300);

		return () => clearTimeout(timer);
	}, [commandSearch]);

	// Search users when debounced search changes
	React.useEffect(() => {
		// Cancel any in-flight requests
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		if (!debouncedSearch || debouncedSearch.length < 2) {
			setSearchUsers([]);
			setIsSearching(false);
			return;
		}

		const abortController = new AbortController();
		abortControllerRef.current = abortController;
		setIsSearching(true);

		getAdminUsers({ search: debouncedSearch, limit: 10 }, { signal: abortController.signal })
			.then((users) => {
				if (!abortController.signal.aborted) {
					setSearchUsers(users);
					setIsSearching(false);
				}
			})
			.catch((error) => {
				// Don't treat aborted requests as errors
				if (error.name === "AbortError" || abortController.signal.aborted) {
					return;
				}
				console.error("Failed to search users:", error);
				setSearchUsers([]);
				setIsSearching(false);
			});

		return () => {
			abortController.abort();
		};
	}, [debouncedSearch]);

	// Mock data for MVP
	const mockFinanceData = [
		{ date: "Jan", revenue: 25000, fees: 2500, payouts: 22500 },
		{ date: "Feb", revenue: 28000, fees: 2800, payouts: 25200 },
		{ date: "Mar", revenue: 32000, fees: 3200, payouts: 28800 },
		{ date: "Apr", revenue: 35000, fees: 3500, payouts: 31500 },
		{ date: "May", revenue: 38000, fees: 3800, payouts: 34200 },
		{ date: "Jun", revenue: 42000, fees: 4200, payouts: 37800 },
	];

	const mockAuditLog: AuditLogEntry[] = [
		{
			id: "1",
			action: "Approved Listing",
			actor: "admin@example.com",
			target: "example.com",
			targetType: "listing",
			timestamp: new Date(Date.now() - 3600000).toISOString(),
		},
		{
			id: "2",
			action: "Suspended User",
			actor: "admin@example.com",
			target: "user@example.com",
			targetType: "user",
			reason: "Violation of terms of service",
			timestamp: new Date(Date.now() - 7200000).toISOString(),
		},
		{
			id: "3",
			action: "Resolved Dispute",
			actor: "admin@example.com",
			target: "DISP-001",
			targetType: "dispute",
			timestamp: new Date(Date.now() - 10800000).toISOString(),
		},
	];

	// Moderation dialog props
	const getModerationDialogProps = () => {
		if (!moderationAction) return null;

		switch (moderationAction) {
			case "approve":
				return {
					title: "Approve Listing?",
					description: `Are you sure you want to approve the listing for ${selectedListing?.domain?.fqdn}? This will make it visible to all users.`,
					actionLabel: "Approve",
					actionVariant: "default" as const,
					requireReason: false,
				};
			case "suspend":
				if (selectedListing) {
					return {
						title: "Suspend Listing?",
						description: `Are you sure you want to suspend the listing for ${selectedListing.domain?.fqdn}? Users will no longer be able to hire this domain.`,
						actionLabel: "Suspend",
						actionVariant: "destructive" as const,
						requireReason: true,
					};
				} else if (selectedUser) {
					return {
						title: "Suspend User?",
						description: `Are you sure you want to suspend ${selectedUser.email}? They will not be able to access their account.`,
						actionLabel: "Suspend",
						actionVariant: "destructive" as const,
						requireReason: true,
					};
				}
				break;
			case "unsuspend":
				return {
					title: "Unsuspend User?",
					description: `Are you sure you want to unsuspend ${selectedUser?.email}? They will regain access to their account.`,
					actionLabel: "Unsuspend",
					actionVariant: "default" as const,
					requireReason: true,
				};
			case "ban":
				return {
					title: "Ban User Permanently?",
					description: `Are you sure you want to permanently ban ${selectedUser?.email}? This action cannot be easily undone.`,
					actionLabel: "Ban Permanently",
					actionVariant: "destructive" as const,
					requireReason: true,
				};
		}
		return null;
	};

	const dialogProps = getModerationDialogProps();

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
					<h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
					<p className="text-muted-foreground">
						Manage users, listings, and system health
					</p>
				</div>
				<Button onClick={() => setIsCommandOpen(true)} variant="outline">
					<Search className="mr-2 h-4 w-4" />
					Search <kbd className="ml-2 text-xs">⌘K</kbd>
				</Button>
			</div>

			<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="listings">Listings</TabsTrigger>
					<TabsTrigger value="users">Users</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value="overview" className="space-y-6 mt-6">
					{/* System Health Metrics */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<SystemHealthCard
							title="API Uptime"
							value="99.9"
							unit="%"
							status="healthy"
							description="Last 30 days"
						/>
						<SystemHealthCard
							title="Error Rate"
							value="0.1"
							unit="%"
							status="healthy"
							trend={-0.5}
							description="Errors per request"
						/>
						<SystemHealthCard
							title="Avg Response Time"
							value="45"
							unit="ms"
							status="healthy"
							trend={-10}
							description="API latency"
						/>
						<SystemHealthCard
							title="Active Users"
							value="1,234"
							status="healthy"
							trend={15}
							description="Last 24 hours"
						/>
					</div>

					{/* Finance Overview */}
					<FinanceOverviewCard
						title="Finance Overview"
						description="Platform revenue, fees, and payouts over the last 6 months"
						data={mockFinanceData}
						totalRevenue={200000}
						totalFees={20000}
						totalPayouts={180000}
					/>

					{/* Audit Log */}
					<AuditLogViewer entries={mockAuditLog} />
				</TabsContent>

				{/* Listings Tab */}
				<TabsContent value="listings" className="space-y-4 mt-6">
					<div className="flex gap-4 items-center">
						<div className="flex-1">
							<label className="text-sm font-medium mb-2 block">Status</label>
							<Select
								value={listingsStatusFilter}
								onValueChange={(value) => setListingsStatusFilter(value as ListingsStatusFilter)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="paused">Paused</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Listings Moderation Queue</CardTitle>
						</CardHeader>
						<CardContent>
							{listingsQuery.isLoading ? (
								<div className="space-y-3">
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
								</div>
							) : (listingsQuery.data?.length ?? 0) === 0 ? (
								<p className="text-center text-muted-foreground py-8">
									No listings found
								</p>
							) : (
								<DataTable
									columns={listingsColumns}
									data={listingsQuery.data ?? []}
									meta={{
										onApprove: handleApproveListing,
										onSuspend: handleSuspendListing,
									}}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Users Tab */}
				<TabsContent value="users" className="space-y-4 mt-6">
					<div className="flex gap-4 items-center">
						<div className="flex-1">
							<label className="text-sm font-medium mb-2 block">Role</label>
							<Select
								value={usersRoleFilter}
								onValueChange={(value) => setUsersRoleFilter(value as UsersRoleFilter)}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="All roles" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									<SelectItem value="owner">Owner</SelectItem>
									<SelectItem value="hirer">Hirer</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>User Management</CardTitle>
						</CardHeader>
						<CardContent>
							{usersQuery.isLoading ? (
								<div className="space-y-3">
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
									<Skeleton className="h-12 w-full" />
								</div>
							) : (usersQuery.data?.length ?? 0) === 0 ? (
								<p className="text-center text-muted-foreground py-8">
									No users found
								</p>
							) : (
								<DataTable
									columns={usersColumns}
									data={usersQuery.data ?? []}
									meta={{
										onSuspend: handleSuspendUser,
										onUnsuspend: handleUnsuspendUser,
										onBan: handleBanUser,
									}}
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Moderation Dialog */}
			{dialogProps && (
				<ModerationDialog
					isOpen={isModerationOpen}
					onOpenChange={setIsModerationOpen}
					title={dialogProps.title}
					description={dialogProps.description}
					actionLabel={dialogProps.actionLabel}
					actionVariant={dialogProps.actionVariant}
					requireReason={dialogProps.requireReason}
					onConfirm={handleModerationConfirm}
					isLoading={moderateListingMutation.isPending || moderateUserMutation.isPending}
				/>
			)}

			{/* Command Palette */}
			<CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
				<CommandInput
					placeholder="Search users, listings, or actions..."
					value={commandSearch}
					onValueChange={setCommandSearch}
				/>
				<CommandList>
					<CommandEmpty>
						{isSearching ? "Searching..." : "No results found."}
					</CommandEmpty>
					
					{searchUsers.length > 0 && (
						<CommandGroup heading="Users">
							{searchUsers.map((user) => (
								<CommandItem
									key={user.id}
									onSelect={() => {
										setActiveTab("users");
										setSelectedUser(user);
										setIsCommandOpen(false);
										// Show action menu for the selected user
										setTimeout(() => {
											// This will allow the user to be pre-selected after navigating
											// In a real implementation, you might want to scroll to the user
										}, 100);
									}}
								>
									<div className="flex items-center gap-2 flex-1">
										<div className="flex-1">
											<div className="font-medium">{user.name || "No name"}</div>
											<div className="text-sm text-muted-foreground">{user.email}</div>
										</div>
										{user.suspended && (
											<span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
												Suspended
											</span>
										)}
										{user.bannedAt && (
											<span className="text-xs px-2 py-1 rounded bg-destructive text-destructive-foreground">
												Banned
											</span>
										)}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					)}
					
					{searchUsers.length > 0 && (
						<CommandGroup heading="User Actions">
							{searchUsers.map((user) => (
								<React.Fragment key={`actions-${user.id}`}>
									{!user.suspended && !user.bannedAt && (
										<CommandItem
											onSelect={() => {
												setSelectedUser(user);
												setModerationAction("suspend");
												setIsModerationOpen(true);
												setIsCommandOpen(false);
											}}
										>
											<UserX className="mr-2 h-4 w-4" />
											Suspend {user.email}
										</CommandItem>
									)}
									{user.suspended && !user.bannedAt && (
										<CommandItem
											onSelect={() => {
												setSelectedUser(user);
												setModerationAction("unsuspend");
												setIsModerationOpen(true);
												setIsCommandOpen(false);
											}}
										>
											<UserCheck className="mr-2 h-4 w-4" />
											Unsuspend {user.email}
										</CommandItem>
									)}
									{!user.bannedAt && (
										<CommandItem
											onSelect={() => {
												setSelectedUser(user);
												setModerationAction("ban");
												setIsModerationOpen(true);
												setIsCommandOpen(false);
											}}
										>
											<Ban className="mr-2 h-4 w-4" />
											Ban {user.email}
										</CommandItem>
									)}
								</React.Fragment>
							))}
						</CommandGroup>
					)}
					
					<CommandGroup heading="Quick Actions">
						<CommandItem
							onSelect={() => {
								setActiveTab("listings");
								setIsCommandOpen(false);
							}}
						>
							View all listings
						</CommandItem>
						<CommandItem
							onSelect={() => {
								setActiveTab("users");
								setIsCommandOpen(false);
							}}
						>
							View all users
						</CommandItem>
						<CommandItem
							onSelect={() => {
								window.location.href = "/admin/disputes";
								setIsCommandOpen(false);
							}}
						>
							View disputes
						</CommandItem>
						<CommandItem
							onSelect={() => {
								setActiveTab("overview");
								setIsCommandOpen(false);
							}}
						>
							View system health
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</CommandDialog>
		</div>
	);
}

