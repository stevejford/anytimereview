"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WizardContainer, type WizardStep } from "./wizard-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ListingCreationWizardProps {
	domainId?: string;
	onComplete?: (listingId: string) => void;
}

export function ListingCreationWizard({ domainId, onComplete }: ListingCreationWizardProps) {
	const router = useRouter();
	const [currentStep, setCurrentStep] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(false);

	// Step 1: Basic Info
	const [mode, setMode] = React.useState<"exclusive" | "shared_slugs">("exclusive");
	const [description, setDescription] = React.useState("");

	// Step 2: Pricing
	const [pricingType, setPricingType] = React.useState<"period" | "per_click" | "both">("period");
	const [monthlyPrice, setMonthlyPrice] = React.useState("");
	const [perClickPrice, setPerClickPrice] = React.useState("");

	// Step 3: Availability
	const [minHireDays, setMinHireDays] = React.useState("30");
	const [maxConcurrentHires, setMaxConcurrentHires] = React.useState("1");

	const handleComplete = async () => {
		setIsLoading(true);
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1500));
		setIsLoading(false);
		
		const mockListingId = `listing-${Date.now()}`;
		toast.success("Listing created successfully");
		
		if (onComplete) {
			onComplete(mockListingId);
		} else {
			router.push("/dashboard/listings");
		}
	};

	const canProceedFromStep1 = mode !== "";
	const canProceedFromStep2 = 
		pricingType === "period" ? monthlyPrice.trim() !== "" :
		pricingType === "per_click" ? perClickPrice.trim() !== "" :
		monthlyPrice.trim() !== "" && perClickPrice.trim() !== "";
	const canProceedFromStep3 = minHireDays.trim() !== "" && maxConcurrentHires.trim() !== "";

	const steps: WizardStep[] = [
		{
			id: "basic",
			title: "Basic Information",
			description: "Choose your listing type and add a description",
			content: (
				<div className="space-y-6">
					<div className="space-y-3">
						<Label>Hire Mode</Label>
						<RadioGroup value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="exclusive" id="exclusive" />
								<Label htmlFor="exclusive" className="flex-1 cursor-pointer space-y-1">
									<div className="font-medium">Exclusive</div>
									<div className="text-sm text-muted-foreground">
										Hirer gets full control of the domain during hire period
									</div>
								</Label>
							</div>
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="shared_slugs" id="shared_slugs" />
								<Label htmlFor="shared_slugs" className="flex-1 cursor-pointer space-y-1">
									<div className="font-medium">Shared Slugs</div>
									<div className="text-sm text-muted-foreground">
										Multiple hirers can use different paths on your domain
									</div>
								</Label>
							</div>
						</RadioGroup>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description (Optional)</Label>
						<Textarea
							id="description"
							placeholder="Describe your domain, its history, and potential uses..."
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={4}
						/>
					</div>
				</div>
			),
		},
		{
			id: "pricing",
			title: "Pricing",
			description: "Set your hire pricing",
			content: (
				<div className="space-y-6">
					<div className="space-y-3">
						<Label>Pricing Model</Label>
						<RadioGroup value={pricingType} onValueChange={(value) => setPricingType(value as typeof pricingType)}>
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="period" id="period" />
								<Label htmlFor="period" className="flex-1 cursor-pointer">
									Monthly hire only
								</Label>
							</div>
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="per_click" id="per_click" />
								<Label htmlFor="per_click" className="flex-1 cursor-pointer">
									Per-click only
								</Label>
							</div>
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="both" id="both" />
								<Label htmlFor="both" className="flex-1 cursor-pointer">
									Both monthly and per-click
								</Label>
							</div>
						</RadioGroup>
					</div>
					{(pricingType === "period" || pricingType === "both") && (
						<div className="space-y-2">
							<Label htmlFor="monthlyPrice">Monthly Price (USD)</Label>
							<Input
								id="monthlyPrice"
								type="number"
								placeholder="100.00"
								value={monthlyPrice}
								onChange={(e) => setMonthlyPrice(e.target.value)}
								min="0"
								step="0.01"
							/>
						</div>
					)}
					{(pricingType === "per_click" || pricingType === "both") && (
						<div className="space-y-2">
							<Label htmlFor="perClickPrice">Per-Click Price (USD)</Label>
							<Input
								id="perClickPrice"
								type="number"
								placeholder="0.50"
								value={perClickPrice}
								onChange={(e) => setPerClickPrice(e.target.value)}
								min="0"
								step="0.01"
							/>
						</div>
					)}
				</div>
			),
		},
		{
			id: "availability",
			title: "Availability",
			description: "Configure hire terms",
			content: (
				<div className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="minDays">Minimum Hire Period (Days)</Label>
						<Input
							id="minDays"
							type="number"
							placeholder="30"
							value={minHireDays}
							onChange={(e) => setMinHireDays(e.target.value)}
							min="1"
						/>
						<p className="text-xs text-muted-foreground">
							Minimum number of days a hirer must hire for
						</p>
					</div>
					<div className="space-y-2">
						<Label htmlFor="maxHires">Maximum Concurrent Hires</Label>
						<Input
							id="maxHires"
							type="number"
							placeholder="1"
							value={maxConcurrentHires}
							onChange={(e) => setMaxConcurrentHires(e.target.value)}
							min="1"
						/>
						<p className="text-xs text-muted-foreground">
							For shared slugs mode, how many hirers can use this domain simultaneously
						</p>
					</div>
				</div>
			),
		},
	];

	return (
		<WizardContainer
			steps={steps}
			currentStep={currentStep}
			onStepChange={setCurrentStep}
			onComplete={handleComplete}
			canGoNext={
				currentStep === 0 ? canProceedFromStep1 :
				currentStep === 1 ? canProceedFromStep2 :
				canProceedFromStep3
			}
			isLoading={isLoading}
			title="Create Listing"
			description="Set up your domain listing step by step"
		/>
	);
}


