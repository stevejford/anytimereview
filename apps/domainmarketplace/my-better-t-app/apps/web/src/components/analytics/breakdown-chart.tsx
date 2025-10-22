"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface BreakdownChartProps {
	data: Array<{ name: string; value: number }>;
	title: string;
	description?: string;
	color?: string;
}

const tooltipStyles: React.CSSProperties = {
	backgroundColor: "var(--background)",
	border: "1px solid var(--border)",
	color: "var(--foreground)",
	borderRadius: "var(--radius)",
	padding: "0.5rem 0.75rem",
};

export function BreakdownChart({ data, title, description, color }: BreakdownChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="h-[350px]">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 16, right: 32, left: 8, bottom: 8 }}>
						<CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground) / 0.2)" />
						<XAxis
							dataKey="name"
							tickLine={false}
							tickMargin={8}
							stroke="hsl(var(--muted-foreground) / 0.4)"
						/>
						<YAxis
							allowDecimals={false}
							tickLine={false}
							stroke="hsl(var(--muted-foreground) / 0.4)"
						/>
						<Tooltip contentStyle={tooltipStyles} />
						<Bar
							dataKey="value"
							radius={[4, 4, 0, 0]}
							fill={color ?? "hsl(var(--primary))"}
						/>
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

export default BreakdownChart;



