"use client";

import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface TimeSeriesChartProps {
	data: Array<{ date: string; validClicks: number; invalidClicks: number }>;
	title: string;
	description?: string;
}

const tooltipStyles: React.CSSProperties = {
	backgroundColor: "var(--background)",
	border: "1px solid var(--border)",
	color: "var(--foreground)",
	borderRadius: "var(--radius)",
	padding: "0.5rem 0.75rem",
};

export function TimeSeriesChart({ data, title, description }: TimeSeriesChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				{description ? <CardDescription>{description}</CardDescription> : null}
			</CardHeader>
			<CardContent className="h-[350px]">
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data} margin={{ top: 16, right: 32, left: 8, bottom: 8 }}>
						<CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--muted-foreground) / 0.2)" />
						<XAxis
							dataKey="date"
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
						<Legend />
						<Line
							type="monotone"
							dataKey="validClicks"
							name="Valid Clicks"
							stroke="hsl(var(--primary))"
							strokeWidth={2}
							dot={{ r: 3 }}
							activeDot={{ r: 5 }}
						/>
						<Line
							type="monotone"
							dataKey="invalidClicks"
							name="Invalid Clicks"
							stroke="hsl(var(--destructive))"
							strokeWidth={2}
							dot={{ r: 3 }}
							activeDot={{ r: 5 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}

export default TimeSeriesChart;



