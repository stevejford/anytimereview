"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Shield, User, FileText, AlertTriangle } from "lucide-react";

export interface AuditLogEntry {
	id: string;
	action: string;
	actor: string;
	target: string;
	targetType: "user" | "listing" | "dispute" | "hire";
	reason?: string;
	timestamp: string;
	metadata?: Record<string, unknown>;
}

interface AuditLogViewerProps {
	entries: AuditLogEntry[];
	isLoading?: boolean;
}

export function AuditLogViewer({ entries, isLoading = false }: AuditLogViewerProps) {
	const getIcon = (targetType: AuditLogEntry["targetType"]) => {
		switch (targetType) {
			case "user":
				return User;
			case "listing":
				return FileText;
			case "dispute":
				return AlertTriangle;
			default:
				return Shield;
		}
	};

	const getActionColor = (action: string) => {
		const lowerAction = action.toLowerCase();
		if (lowerAction.includes("suspend") || lowerAction.includes("ban") || lowerAction.includes("reject")) {
			return "destructive" as const;
		}
		if (lowerAction.includes("approve") || lowerAction.includes("unsuspend") || lowerAction.includes("resolve")) {
			return "default" as const;
		}
		return "secondary" as const;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Audit Log</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-96">
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex gap-4 border-b pb-3">
									<Skeleton className="h-10 w-10 rounded" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-1/3" />
										<Skeleton className="h-3 w-2/3" />
									</div>
								</div>
							))}
						</div>
					) : entries.length === 0 ? (
						<div className="flex items-center justify-center h-full text-muted-foreground">
							<p>No audit log entries</p>
						</div>
					) : (
						<div className="space-y-0">
							{entries.map((entry) => {
								const Icon = getIcon(entry.targetType);
								const actionColor = getActionColor(entry.action);

								return (
									<div
										key={entry.id}
										className="flex gap-4 border-b last:border-0 py-3"
									>
										<div className="flex-shrink-0">
											<div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
												<Icon className="h-5 w-5 text-muted-foreground" />
											</div>
										</div>
										<div className="flex-1 space-y-1">
											<div className="flex items-center gap-2">
												<Badge variant={actionColor}>
													{entry.action}
												</Badge>
												<span className="text-sm font-medium">{entry.actor}</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{entry.targetType}: <span className="font-medium">{entry.target}</span>
											</p>
											{entry.reason && (
												<p className="text-sm text-muted-foreground italic">
													Reason: {entry.reason}
												</p>
											)}
											<p className="text-xs text-muted-foreground">
												{format(new Date(entry.timestamp), "MMM dd, yyyy 'at' h:mm a")}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}


