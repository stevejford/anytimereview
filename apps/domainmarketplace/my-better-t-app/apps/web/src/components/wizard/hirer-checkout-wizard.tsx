"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WizardContainer, type WizardStep } from "./wizard-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Listing } from "@/lib/api-client";

interface HirerCheckoutWizardProps {
	listing: Listing;
	onComplete?: (hireId: string) => void;
}

export function HirerCheckoutWizard({ listing, onComplete }: HirerCheckoutWizardProps) {
	const router = useRouter();
	const [currentStep, setCurrentStep] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(false);

	// Step 1: Type Selection
	const [hireType, setHireType] = React.useState<"period" | "per_click">("period");

	// Step 2: Configuration
	const [hireMonths, setHireMonths] = React.useState("1");
	const [destinationUrl, setDestinationUrl] = React.useState("");

	// Step 3: Billing (for period) or Activation (for per-click)
	const [paymentConfirmed, setPaymentConfirmed] = React.useState(false);

	const hasPeriodPricing = listing.pricePeriodCents && listing.pricePeriodCents > 0;
	const hasClickPricing = listing.priceClickCents && listing.priceClickCents > 0;

	// Auto-select type if only one is available
	React.useEffect(() => {
		if (hasPeriodPricing && !hasClickPricing) {
			setHireType("period");
		} else if (!hasPeriodPricing && hasClickPricing) {
			setHireType("per_click");
		}
	}, [hasPeriodPricing, hasClickPricing]);

	const handlePayment = async () => {
		setIsLoading(true);
		// Simulate payment processing
		await new Promise(resolve => setTimeout(resolve, 2000));
		setPaymentConfirmed(true);
		setIsLoading(false);
		toast.success("Payment processed successfully");
	};

	const handleComplete = async () => {
		setIsLoading(true);
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		setIsLoading(false);

		const mockHireId = `hire-${Date.now()}`;
		toast.success("Hire created successfully");

		if (onComplete) {
			onComplete(mockHireId);
		} else {
			router.push("/dashboard/hires");
		}
	};

	const formatPrice = (cents: number | null) => {
		if (!cents) return "$0.00";
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
		}).format(cents / 100);
	};

	const calculateTotal = () => {
		if (hireType === "period") {
			const months = parseInt(hireMonths) || 1;
			const monthlyPrice = listing.pricePeriodCents || 0;
			return formatPrice(monthlyPrice * months);
		}
		return "$0.00 (Pay as you go)";
	};

	const steps: WizardStep[] = [
		{
			id: "type",
			title: "Select Hire Type",
			description: "Choose how you want to hire this domain",
			content: (
				<div className="space-y-4">
					<RadioGroup value={hireType} onValueChange={(value) => setHireType(value as typeof hireType)}>
						{hasPeriodPricing && (
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="period" id="period-type" />
								<Label htmlFor="period-type" className="flex-1 cursor-pointer space-y-1">
									<div className="font-medium">Monthly Hire</div>
									<div className="text-sm text-muted-foreground">
										{formatPrice(listing.pricePeriodCents)} per month - Pay upfront for your hire period
									</div>
								</Label>
							</div>
						)}
						{hasClickPricing && (
							<div className="flex items-center space-x-2 rounded-lg border p-4">
								<RadioGroupItem value="per_click" id="click-type" />
								<Label htmlFor="click-type" className="flex-1 cursor-pointer space-y-1">
									<div className="font-medium">Per-Click Hire</div>
									<div className="text-sm text-muted-foreground">
										{formatPrice(listing.priceClickCents)} per click - Pay only for traffic you receive
									</div>
								</Label>
							</div>
						)}
					</RadioGroup>
				</div>
			),
		},
		{
			id: "config",
			title: "Configure Hire",
			description: "Set up your hire details",
			content: (
				<div className="space-y-6">
					{hireType === "period" && (
						<div className="space-y-2">
							<Label htmlFor="months">Hire Period (Months)</Label>
							<Input
								id="months"
								type="number"
								placeholder="1"
								value={hireMonths}
								onChange={(e) => setHireMonths(e.target.value)}
								min="1"
								max="12"
							/>
							<p className="text-xs text-muted-foreground">
								Choose how many months you want to hire this domain
							</p>
						</div>
					)}
					<div className="space-y-2">
						<Label htmlFor="destination">Destination URL</Label>
						<Input
							id="destination"
							type="url"
							placeholder="https://your-website.com"
							value={destinationUrl}
							onChange={(e) => setDestinationUrl(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							Where should traffic be redirected? You can configure advanced routing later.
						</p>
					</div>
					<Alert>
						<AlertDescription>
							<strong>Total:</strong> {calculateTotal()}
							{hireType === "per_click" && " (billed monthly based on clicks received)"}
						</AlertDescription>
					</Alert>
				</div>
			),
		},
		{
			id: "payment",
			title: hireType === "period" ? "Payment" : "Activation",
			description: hireType === "period" ? "Complete your payment" : "Activate your hire",
			content: (
				<div className="space-y-6">
					{paymentConfirmed ? (
						<Alert>
							<CheckCircle2 className="h-4 w-4" />
							<AlertDescription>
								{hireType === "period"
									? "Payment confirmed! Your hire is ready to activate."
									: "Your hire is activated and ready to use."}
							</AlertDescription>
						</Alert>
					) : (
						<>
							<div className="rounded-lg border p-4 space-y-3">
								<div className="flex justify-between">
									<span className="text-sm">Domain:</span>
									<span className="text-sm font-medium">{listing.domain?.fqdn || "N/A"}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-sm">Type:</span>
									<span className="text-sm font-medium capitalize">{hireType === "period" ? "Monthly" : "Per-Click"}</span>
								</div>
								{hireType === "period" && (
									<div className="flex justify-between">
										<span className="text-sm">Duration:</span>
										<span className="text-sm font-medium">{hireMonths} month(s)</span>
									</div>
								)}
								<div className="flex justify-between border-t pt-3">
									<span className="font-medium">Total:</span>
									<span className="font-bold">{calculateTotal()}</span>
								</div>
							</div>
							{hireType === "period" ? (
								<>
									<Alert>
										<AlertDescription>
											In a production environment, you would be redirected to Stripe to complete payment.
										</AlertDescription>
									</Alert>
									<Button onClick={handlePayment} disabled={isLoading} className="w-full">
										{isLoading ? "Processing..." : "Proceed to Payment"}
									</Button>
								</>
							) : (
								<Button onClick={handlePayment} disabled={isLoading} className="w-full">
									{isLoading ? "Activating..." : "Activate Hire"}
								</Button>
							)}
						</>
					)}
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
				currentStep === 0 ? true :
				currentStep === 1 ? destinationUrl.trim() !== "" :
				paymentConfirmed
			}
			isLoading={isLoading}
			title="Hire Domain"
			description={`Complete your hire for ${listing.domain?.fqdn || "this domain"}`}
		/>
	);
}


