"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface FinanceData {
	date: string;
	revenue: number;
	fees: number;
	payouts: number;
}

interface FinanceOverviewCardProps {
	title: string;
	description?: string;
	data: FinanceData[];
	totalRevenue: number;
	totalFees: number;
	totalPayouts: number;
}

export function FinanceOverviewCard({
	title,
	description,
	data,
	totalRevenue,
	totalFees,
	totalPayouts,
}: FinanceOverviewCardProps) {
	const formatter = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				<div className="space-y-6">
					{/* Summary metrics */}
					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Total Revenue</p>
							<p className="text-2xl font-bold">{formatter.format(totalRevenue / 100)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Platform Fees</p>
							<p className="text-2xl font-bold">{formatter.format(totalFees / 100)}</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm text-muted-foreground">Payouts</p>
							<p className="text-2xl font-bold">{formatter.format(totalPayouts / 100)}</p>
						</div>
					</div>

					{/* Chart */}
					<ResponsiveContainer width="100%" height={200}>
						<AreaChart data={data}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis
								dataKey="date"
								className="text-xs"
								tick={{ fontSize: 12 }}
							/>
							<YAxis
								className="text-xs"
								tick={{ fontSize: 12 }}
								tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
							/>
							<Tooltip
								formatter={(value: number) => formatter.format(value / 100)}
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "var(--radius)",
								}}
							/>
							<Area
								type="monotone"
								dataKey="revenue"
								stackId="1"
								stroke="hsl(var(--primary))"
								fill="hsl(var(--primary))"
								fillOpacity={0.3}
							/>
							<Area
								type="monotone"
								dataKey="fees"
								stackId="2"
								stroke="hsl(var(--secondary))"
								fill="hsl(var(--secondary))"
								fillOpacity={0.3}
							/>
							<Area
								type="monotone"
								dataKey="payouts"
								stackId="3"
								stroke="hsl(var(--accent))"
								fill="hsl(var(--accent))"
								fillOpacity={0.3}
							/>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}


