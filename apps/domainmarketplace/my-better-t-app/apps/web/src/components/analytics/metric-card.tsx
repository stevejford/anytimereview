"use client";

import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";

type Trend = "up" | "down" | "neutral";

interface MetricCardProps {
	title: string;
	value: number | string;
	trend?: Trend;
	change?: number;
	description?: string;
	icon?: ReactNode;
	badge?: {
		label: string;
		variant?: BadgeProps["variant"];
	};
}

function renderTrend(trend: Trend | undefined, change: number | undefined) {
	if (!trend || change === undefined) return null;

	const formatted = `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;

	switch (trend) {
		case "up":
			return (
				<div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
					<TrendingUp className="h-4 w-4" />
					<span>{formatted}</span>
				</div>
			);
		case "down":
			return (
				<div className="flex items-center gap-1 text-sm text-rose-600 dark:text-rose-400">
					<TrendingDown className="h-4 w-4" />
					<span>{formatted}</span>
				</div>
			);
		default:
			return (
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<Minus className="h-4 w-4" />
					<span>{formatted}</span>
				</div>
			);
	}
}

export function MetricCard({
	title,
	value,
	trend,
	change,
	description,
	icon,
	badge,
}: MetricCardProps) {
	const formattedValue =
		typeof value === "number"
			? new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1,
			}).format(value)
			: value;

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
				<div>
					<CardTitle className="text-sm font-medium text-muted-foreground">
						{title}
					</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</div>
				<div className="flex items-center gap-2">
					{badge ? <Badge variant={badge.variant ?? "secondary"}>{badge.label}</Badge> : null}
					{icon ? <div className="text-muted-foreground">{icon}</div> : null}
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-end justify-between">
					<div>
						<span className="text-3xl font-semibold tracking-tight">
							{formattedValue}
						</span>
						{trend ? <div className="mt-2">{renderTrend(trend, change)}</div> : null}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

export default MetricCard;



