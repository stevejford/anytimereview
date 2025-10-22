"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPeriodCheckout } from "@/lib/api-client";
import PaymentForm from "./payment-form";

interface CheckoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	hireId: string;
	onSuccess?: () => void;
}

export default function CheckoutDialog({
	open,
	onOpenChange,
	hireId,
	onSuccess,
}: CheckoutDialogProps) {
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [invoiceId, setInvoiceId] = useState<string | null>(null);

	const checkoutMutation = useMutation({
		mutationFn: () => createPeriodCheckout({ hireId }),
		onSuccess: (data) => {
			setClientSecret(data.clientSecret);
			setInvoiceId(data.invoiceId);
		},
	});

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			// Reset state when closing
			setClientSecret(null);
			setInvoiceId(null);
			checkoutMutation.reset();
		}
		onOpenChange(newOpen);
	};

	const handlePaymentSuccess = () => {
		handleOpenChange(false);
		onSuccess?.();
	};

	// Trigger checkout when dialog opens
	if (open && !clientSecret && !checkoutMutation.isPending && !checkoutMutation.isError) {
		checkoutMutation.mutate();
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Complete Payment</DialogTitle>
					<DialogDescription>
						Enter your payment details to complete the hire checkout.
					</DialogDescription>
				</DialogHeader>

				<div className="mt-4">
					{checkoutMutation.isPending && (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
							<p className="mt-4 text-sm text-gray-500">Preparing checkout...</p>
						</div>
					)}

					{checkoutMutation.isError && (
						<Alert variant="destructive">
							<AlertDescription>
								Failed to create checkout session. Please try again.
							</AlertDescription>
						</Alert>
					)}

					{clientSecret && (
						<PaymentForm
							clientSecret={clientSecret}
							onSuccess={handlePaymentSuccess}
							onError={(error) => console.error("Payment error:", error)}
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

