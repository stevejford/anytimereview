"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
	Elements,
	PaymentElement,
	useStripe,
	useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PaymentFormProps {
	clientSecret: string;
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

function CheckoutForm({ onSuccess, onError }: Omit<PaymentFormProps, "clientSecret">) {
	const stripe = useStripe();
	const elements = useElements();
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!stripe || !elements) {
			return;
		}

		setIsProcessing(true);
		setErrorMessage(null);

		try {
			const { error } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: `${window.location.origin}/dashboard/billing?payment=success`,
				},
			});

			if (error) {
				setErrorMessage(error.message ?? "An error occurred");
				onError?.(error.message ?? "An error occurred");
			} else {
				onSuccess?.();
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "An unexpected error occurred";
			setErrorMessage(message);
			onError?.(message);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<PaymentElement />
			
			{errorMessage && (
				<Alert variant="destructive">
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			)}

			<Button
				type="submit"
				disabled={!stripe || isProcessing}
				className="w-full"
			>
				{isProcessing ? "Processing..." : "Pay Now"}
			</Button>
		</form>
	);
}

export default function PaymentForm({
	clientSecret,
	onSuccess,
	onError,
}: PaymentFormProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div>Loading payment form...</div>;
	}

	const options = {
		clientSecret,
		appearance: {
			theme: "stripe" as const,
		},
	};

	return (
		<Elements stripe={stripePromise} options={options}>
			<CheckoutForm onSuccess={onSuccess} onError={onError} />
		</Elements>
	);
}

