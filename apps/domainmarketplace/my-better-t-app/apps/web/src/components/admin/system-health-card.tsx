"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface SystemHealthCardProps {
	title: string;
	value: number | string;
	unit?: string;
	status: "healthy" | "warning" | "critical";
	trend?: number;
	description?: string;
}

export function SystemHealthCard({
	title,
	value,
	unit = "",
	status,
	trend,
	description,
}: SystemHealthCardProps) {
	const statusConfig = {
		healthy: {
			color: "default" as const,
			icon: Activity,
		},
		warning: {
			color: "secondary" as const,
			icon: AlertCircle,
		},
		critical: {
			color: "destructive" as const,
			icon: AlertCircle,
		},
	};

	const config = statusConfig[status];
	const StatusIcon = config.icon;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Badge variant={config.color} className="flex items-center gap-1">
					<StatusIcon className="h-3 w-3" />
					{status.charAt(0).toUpperCase() + status.slice(1)}
				</Badge>
			</CardHeader>
			<CardContent>
				<div className="space-y-2">
					<div className="text-3xl font-bold">
						{value}
						{unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
					</div>
					{trend !== undefined && (
						<div className="flex items-center gap-1 text-sm">
							{trend >= 0 ? (
								<TrendingUp className="h-4 w-4 text-green-500" />
							) : (
								<TrendingDown className="h-4 w-4 text-red-500" />
							)}
							<span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
								{Math.abs(trend)}%
							</span>
							<span className="text-muted-foreground">from last period</span>
						</div>
					)}
					{description && (
						<p className="text-sm text-muted-foreground">{description}</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}


