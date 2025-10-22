"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { WizardContainer, type WizardStep } from "./wizard-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
	startConnectOnboarding,
	getConnectStatus,
	createDomain,
	verifyDomain,
	getDomainStatus,
	createListing,
} from "@/lib/api-client";

interface OwnerOnboardingWizardProps {
	onComplete?: () => void;
}

export function OwnerOnboardingWizard({ onComplete }: OwnerOnboardingWizardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user } = useUser();
	const [currentStep, setCurrentStep] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Step 1: Stripe Connection
	const [stripeAccountId, setStripeAccountId] = React.useState<string | null>(null);

	// Step 2: Domain Verification
	const [domainName, setDomainName] = React.useState("");
	const [domainId, setDomainId] = React.useState<string | null>(null);
	const [verificationInstructions, setVerificationInstructions] = React.useState<string | null>(null);

	// Step 3: Listing Creation
	const [listingId, setListingId] = React.useState<string | null>(null);

	// Query Stripe Connect status
	const { data: connectStatus, refetch: refetchConnectStatus } = useQuery({
		queryKey: ["connect-status"],
		queryFn: getConnectStatus,
		retry: false,
	});

	// Check for Stripe redirect params
	React.useEffect(() => {
		const stripeParam = searchParams.get("stripe");
		if (stripeParam === "success") {
			refetchConnectStatus();
			toast.success("Stripe connection successful!");
		} else if (stripeParam === "refresh") {
			refetchConnectStatus();
		}
	}, [searchParams, refetchConnectStatus]);

	// Mutation for starting Stripe Connect onboarding
	const connectStripeMutation = useMutation({
		mutationFn: () =>
			startConnectOnboarding({
				returnUrl: `${window.location.origin}/onboarding?step=1&stripe=success`,
				refreshUrl: `${window.location.origin}/onboarding?step=1&stripe=refresh`,
			}),
		onSuccess: (data) => {
			if (data.accountLinkUrl) {
				window.location.href = data.accountLinkUrl;
			}
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to connect Stripe");
			setError(err.message || "Failed to connect Stripe");
		},
	});

	// Mutation for creating domain
	const createDomainMutation = useMutation({
		mutationFn: (fqdn: string) => createDomain(fqdn),
		onSuccess: (data) => {
			setDomainId(data.id);
			toast.success("Domain created successfully");
			// Automatically start verification
			verifyDomainMutation.mutate(data.id);
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to create domain");
			setError(err.message || "Failed to create domain");
		},
	});

	// Mutation for verifying domain
	const verifyDomainMutation = useMutation({
		mutationFn: (id: string) => verifyDomain(id, { method: "cf_saas" }),
		onSuccess: (data) => {
			setVerificationInstructions(
				data.verificationInstructions || "Verification started. Please wait..."
			);
			toast.info("Verification started. This usually takes 1-2 minutes.");
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to start verification");
			setError(err.message || "Failed to start verification");
		},
	});

	// Query domain status (poll every 5 seconds when domainId exists)
	const { data: domainStatus } = useQuery({
		queryKey: ["domain-status", domainId],
		queryFn: () => getDomainStatus(domainId!),
		enabled: !!domainId,
		refetchInterval: (data) => {
			// Stop polling if verification is complete
			return data?.verificationStatus === "verified" ? false : 5000;
		},
		retry: false,
	});

	// Mutation for creating listing
	const createListingMutation = useMutation({
		mutationFn: () =>
			createListing({
				domainId: domainId!,
				mode: "exclusive",
				pricePeriodCents: 10000, // $100/month default
			}),
		onSuccess: (data) => {
			setListingId(data.id);
			toast.success("Listing published successfully!");
		},
		onError: (err: any) => {
			toast.error(err.message || "Failed to create listing");
			setError(err.message || "Failed to create listing");
		},
	});

	const handleCreateDomain = () => {
		if (!domainName.trim()) {
			toast.error("Please enter a domain name");
			return;
		}
		// Basic domain validation
		const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
		if (!domainRegex.test(domainName)) {
			toast.error("Please enter a valid domain name");
			return;
		}
		createDomainMutation.mutate(domainName);
	};

	const handlePublishListing = () => {
		if (!domainId) {
			toast.error("Domain not created yet");
			return;
		}
		createListingMutation.mutate();
	};

	const handleComplete = async () => {
		try {
			setIsLoading(true);
			setError(null);

			// Update Clerk metadata
			const response = await fetch("/api/user/metadata", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					publicMetadata: { hasCompletedHostOnboarding: true },
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update metadata");
			}

			// Reload user data to get updated metadata
			await user?.reload();

			// Wait for metadata to propagate
			await new Promise((resolve) => setTimeout(resolve, 500));

			toast.success("🎉 Onboarding complete! Welcome to host mode!");

			if (onComplete) {
				onComplete();
			} else {
				router.push("/host/dashboard");
			}
		} catch (err: any) {
			console.error("Error completing onboarding:", err);
			toast.error(err.message || "Failed to complete onboarding");
			setError(err.message || "Failed to complete onboarding");
		} finally {
			setIsLoading(false);
		}
	};

	const steps: WizardStep[] = [
		{
			id: "stripe",
			title: "Connect Stripe",
			description: "Connect your Stripe account to receive payments",
			content: (
				<div className="space-y-4">
					{connectStatus?.onboardingComplete ? (
						<Alert className="border-primary/20 bg-primary/5">
							<CheckCircle2 className="h-4 w-4 text-primary" />
							<AlertDescription>
								Your Stripe account is connected and ready to receive payments.
							</AlertDescription>
						</Alert>
					) : (
						<>
							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>
									You need a Stripe account to receive payments from hirers. We use Stripe Connect
									to securely handle payouts.
								</AlertDescription>
							</Alert>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Click the button below to connect your Stripe account. You'll be redirected to
									Stripe to authorize the connection.
								</p>
								<Button
									onClick={() => connectStripeMutation.mutate()}
									disabled={connectStripeMutation.isPending}
								>
									{connectStripeMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Connecting...
										</>
									) : (
										<>
											<ExternalLink className="mr-2 h-4 w-4" />
											Connect Stripe Account
										</>
									)}
								</Button>
							</div>
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
						</>
					)}
				</div>
			),
		},
		{
			id: "domain",
			title: "Add & Verify Domain",
			description: "Add your domain and verify ownership",
			content: (
				<div className="space-y-4">
					{domainStatus?.verificationStatus === "verified" ? (
						<Alert className="border-primary/20 bg-primary/5">
							<CheckCircle2 className="h-4 w-4 text-primary" />
							<AlertDescription>
								Domain {domainName} has been verified successfully.
							</AlertDescription>
						</Alert>
					) : (
						<>
							{!domainId ? (
								<>
									<div className="space-y-2">
										<Label htmlFor="domain">Domain Name</Label>
										<Input
											id="domain"
											type="text"
											placeholder="example.com"
											value={domainName}
											onChange={(e) => setDomainName(e.target.value)}
											disabled={createDomainMutation.isPending}
										/>
										<p className="text-xs text-muted-foreground">
											Enter the domain name you want to list for hire
										</p>
									</div>
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											We'll provide DNS records for you to add to your domain registrar to verify
											ownership.
										</AlertDescription>
									</Alert>
									<Button
										onClick={handleCreateDomain}
										disabled={createDomainMutation.isPending || !domainName.trim()}
									>
										{createDomainMutation.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating...
											</>
										) : (
											"Create & Verify Domain"
										)}
									</Button>
								</>
							) : (
								<>
									<Alert>
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>
											Domain created. Verification in progress...
										</AlertDescription>
									</Alert>
									{verificationInstructions && (
										<div className="rounded-lg bg-muted p-4">
											<p className="text-sm font-medium">Verification Instructions:</p>
											<p className="mt-2 text-xs text-muted-foreground">
												{verificationInstructions}
											</p>
										</div>
									)}
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin text-primary" />
										<span>
											Checking verification status... This usually takes 1-2 minutes.
										</span>
									</div>
									{domainStatus?.verificationStatus === "failed" && (
										<Alert variant="destructive">
											<AlertCircle className="h-4 w-4" />
											<AlertDescription>
												Verification failed. Please check your DNS records and try again.
											</AlertDescription>
										</Alert>
									)}
								</>
							)}
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}
						</>
					)}
				</div>
			),
		},
		{
			id: "listing",
			title: "Publish Listing",
			description: "Create and publish your domain listing",
			content: (
				<div className="space-y-4">
					{listingId ? (
						<Alert className="border-primary/20 bg-primary/5">
							<CheckCircle2 className="h-4 w-4 text-primary" />
							<AlertDescription>
								Your listing has been published and is now available to hirers!
							</AlertDescription>
						</Alert>
					) : (
						<>
							<Alert>
								<Sparkles className="h-4 w-4" />
								<AlertDescription>
									Your listing will be created with default settings. You can customize pricing and
									hire modes later from your dashboard.
								</AlertDescription>
							</Alert>
							<div className="space-y-2">
								<p className="text-sm">
									<strong>Domain:</strong> {domainName || "N/A"}
								</p>
								<p className="text-sm">
									<strong>Default Price:</strong> $100/month
								</p>
								<p className="text-sm">
									<strong>Mode:</strong> Exclusive hire
								</p>
								<p className="text-sm text-muted-foreground">
									You can edit pricing, hire modes, and other settings from your listings
									dashboard after onboarding.
								</p>
							</div>
							<Button
								onClick={handlePublishListing}
								disabled={createListingMutation.isPending}
							>
								{createListingMutation.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Publishing...
									</>
								) : (
									<>
										<Sparkles className="mr-2 h-4 w-4" />
										Publish Listing
									</>
								)}
							</Button>
							{error && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>{error}</AlertDescription>
								</Alert>
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
				(currentStep === 0 && connectStatus?.onboardingComplete === true) ||
				(currentStep === 1 && domainStatus?.verificationStatus === "verified") ||
				(currentStep === 2 && listingId !== null)
			}
			isLoading={isLoading}
			title="Owner Onboarding"
			description="Get your domain listed in just a few steps"
		/>
	);
}


