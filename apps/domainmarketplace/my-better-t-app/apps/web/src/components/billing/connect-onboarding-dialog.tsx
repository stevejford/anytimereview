"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
	startConnectOnboarding, 
	refreshConnectOnboarding,
	getConnectStatus 
} from "@/lib/api-client";

interface ConnectOnboardingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export default function ConnectOnboardingDialog({
	open,
	onOpenChange,
	onSuccess,
}: ConnectOnboardingDialogProps) {
	const [error, setError] = useState<string | null>(null);

	const { data: status, refetch } = useQuery({
		queryKey: ["connectStatus"],
		queryFn: getConnectStatus,
		enabled: open,
	});

	const onboardingMutation = useMutation({
		mutationFn: () => {
			const returnUrl = `${window.location.origin}/dashboard/billing?connect=success`;
			const refreshUrl = `${window.location.origin}/dashboard/billing?connect=refresh`;
			
			if (status?.accountId) {
				return refreshConnectOnboarding({ returnUrl, refreshUrl });
			}
			return startConnectOnboarding({ returnUrl, refreshUrl });
		},
		onSuccess: (data) => {
			// Redirect to Stripe Connect onboarding
			window.location.href = data.accountLinkUrl;
		},
		onError: (err) => {
			setError(err instanceof Error ? err.message : "Failed to start onboarding");
		},
	});

	const handleStartOnboarding = () => {
		setError(null);
		onboardingMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Setup Stripe Connect</DialogTitle>
					<DialogDescription>
						{status?.onboardingComplete
							? "Your Stripe Connect account is set up and ready to receive payments."
							: "Complete your Stripe Connect onboarding to receive payments for your listings."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{status?.onboardingComplete ? (
						<Alert>
							<AlertDescription className="text-green-600">
								✓ Your account is fully onboarded and can accept payments.
							</AlertDescription>
						</Alert>
					) : (
						<>
							<Alert>
								<AlertDescription>
									You'll be redirected to Stripe to complete the onboarding process. 
									This includes verifying your identity and bank account details.
								</AlertDescription>
							</Alert>

							{status?.detailsSubmitted && !status.chargesEnabled && (
								<Alert variant="default">
									<AlertDescription>
										Your details are being verified. This usually takes a few minutes.
									</AlertDescription>
								</Alert>
							)}
						</>
					)}

					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter>
					<Button
						onClick={handleStartOnboarding}
						disabled={onboardingMutation.isPending || status?.onboardingComplete}
					>
						{onboardingMutation.isPending
							? "Redirecting..."
							: status?.accountId
							? "Continue Onboarding"
							: "Start Onboarding"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

