"use client";

import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface IVTThresholdConfigProps {
	initialAutoCredit?: number;
	initialMaxClicks?: number;
	initialMaxAmount?: number;
	onSave: (thresholds: {
		autoCreditPercent: number;
		maxClicksCap: number;
		maxAmountCents: number;
	}) => void;
}

export function IVTThresholdConfig({
	initialAutoCredit = 2,
	initialMaxClicks = 1000,
	initialMaxAmount = 50000,
	onSave,
}: IVTThresholdConfigProps) {
	const [autoCreditPercent, setAutoCreditPercent] = React.useState(initialAutoCredit);
	const [maxClicksCap, setMaxClicksCap] = React.useState(initialMaxClicks);
	const [maxAmountCents, setMaxAmountCents] = React.useState(initialMaxAmount);
	const [isSaving, setIsSaving] = React.useState(false);

	const handleSave = () => {
		setIsSaving(true);
		onSave({
			autoCreditPercent,
			maxClicksCap,
			maxAmountCents,
		});
		setIsSaving(false);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Auto-Credit Thresholds</CardTitle>
				<CardDescription>
					Configure automated IVT credit policies per invoice
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<Label htmlFor="auto-credit-percent">Auto-credit percentage</Label>
					<Slider
						id="auto-credit-percent"
						min={0}
						max={10}
						step={0.5}
						value={[autoCreditPercent]}
						onValueChange={(values) => setAutoCreditPercent(values[0]!)}
						className="w-full"
					/>
					<div className="text-sm font-medium">{autoCreditPercent}%</div>
					<p className="text-sm text-muted-foreground">
						Percentage of billed clicks automatically credited when classified as IVT
					</p>
				</div>

				<div className="space-y-3">
					<Label htmlFor="max-clicks">Maximum clicks per invoice</Label>
					<Input
						id="max-clicks"
						type="number"
						value={maxClicksCap}
						onChange={(e) => setMaxClicksCap(Number(e.target.value))}
						min={0}
					/>
					<p className="text-sm text-muted-foreground">
						Maximum number of clicks that can be auto-credited per invoice
					</p>
				</div>

				<div className="space-y-3">
					<Label htmlFor="max-amount">Maximum amount per invoice</Label>
					<Input
						id="max-amount"
						type="number"
						value={maxAmountCents}
						onChange={(e) => setMaxAmountCents(Number(e.target.value))}
						min={0}
					/>
					<div className="text-sm font-medium">
						{new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: "USD",
							minimumFractionDigits: 2,
						}).format(maxAmountCents / 100)}
					</div>
					<p className="text-sm text-muted-foreground">
						Maximum dollar amount that can be auto-credited per invoice (in cents)
					</p>
				</div>

				<Alert>
					<AlertDescription>
						These thresholds apply to automatic credits. Manual dispute resolution can
						exceed these limits with proper justification.
					</AlertDescription>
				</Alert>

				<Button onClick={handleSave} disabled={isSaving}>
					Save Thresholds
				</Button>
			</CardContent>
		</Card>
	);
}

