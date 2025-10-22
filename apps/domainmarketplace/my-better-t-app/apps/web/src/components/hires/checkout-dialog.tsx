"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Info } from "lucide-react";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import {
	RadioGroup,
	RadioGroupItem,
} from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
	createHire,
	type CreateHireRequest,
	type Listing,
} from "@/lib/api-client";

const schema = z.object({
	type: z.enum(["period", "per_click"], {
		message: "Please select a hire type",
	}),
});

type FormValues = z.infer<typeof schema>;

interface CheckoutDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	listing: Listing;
	onSuccess: (hireId: string, hireType: "period" | "per_click") => void;
}

function formatCurrency(cents: number | null) {
	if (typeof cents !== "number") return null;
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
	}).format(cents / 100);
}

export default function CheckoutDialog({
	isOpen,
	onOpenChange,
	listing,
	onSuccess,
}: CheckoutDialogProps) {
	const [step, setStep] = useState<1 | 2>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			type: listing.pricePeriodCents ? "period" : "per_click",
		},
	});

	const selectedType = form.watch("type");
	const periodPrice = formatCurrency(listing.pricePeriodCents);
	const clickPrice = formatCurrency(listing.priceClickCents);

	const canSelectPeriod = typeof listing.pricePeriodCents === "number";
	const canSelectPerClick = typeof listing.priceClickCents === "number";

	const handleSubmit = async (values: FormValues) => {
		setIsSubmitting(true);
		setError(null);

		const payload: CreateHireRequest = {
			listingId: listing.id,
			type: values.type,
		};

		try {
			const hire = await createHire(payload);
			onSuccess(hire.id, values.type);
			onOpenChange(false);
			setStep(1);
			form.reset();
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("Unable to create hire. Please try again.");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) {
					setStep(1);
					form.reset();
				}
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Hire {listing.domainId}</DialogTitle>
					<DialogDescription>
						Select a hire plan to get started. Payment integration is coming soon.
					</DialogDescription>
				</DialogHeader>
				{error ? (
					<Alert variant="destructive">
						<AlertTitle>Unable to create hire</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
		{step === 1 ? (
					<Form {...form}>
				<form className="space-y-6">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem className="space-y-4">
										<FormLabel>Select hire type</FormLabel>
										<FormControl>
											<RadioGroup
												onValueChange={field.onChange}
												value={field.value}
												className="grid gap-4"
											>
												<RadioGroupItem
													value="period"
													className="sr-only"
													disabled={!canSelectPeriod}
												/>
												<Card
													className="border-muted-foreground/30 cursor-pointer transition hover:border-primary"
													onClick={() => canSelectPeriod && field.onChange("period")}
													tabIndex={0}
												>
													<CardHeader>
														<CardTitle className="flex items-center justify-between text-base">
															<span>Monthly hire</span>
															{selectedType === "period" && (
																<Badge>Selected</Badge>
															)}
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-2">
														<p className="text-sm text-muted-foreground">
															Fixed monthly subscription.
														</p>
														<p className="text-lg font-semibold">
															{periodPrice ?? "Unavailable"}
														</p>
													</CardContent>
												</Card>

												<RadioGroupItem
													value="per_click"
													className="sr-only"
													disabled={!canSelectPerClick}
												/>
												<Card
													className="border-muted-foreground/30 cursor-pointer transition hover:border-primary"
													onClick={() => canSelectPerClick && field.onChange("per_click")}
													tabIndex={0}
												>
													<CardHeader>
														<CardTitle className="flex items-center justify-between text-base">
															<span>Pay per click</span>
															{selectedType === "per_click" && (
																<Badge>Selected</Badge>
															)}
														</CardTitle>
													</CardHeader>
													<CardContent className="space-y-2">
														<p className="text-sm text-muted-foreground">
															Usage-based billing each month.
														</p>
														<p className="text-lg font-semibold">
															{clickPrice ?? "Unavailable"}
														</p>
													</CardContent>
												</Card>
											</RadioGroup>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<Alert>
								<Info className="h-4 w-4" />
								<AlertTitle>Phase 1 checkout</AlertTitle>
								<AlertDescription>
									Payments are coming soon. We’ll bill you separately for now.
								</AlertDescription>
							</Alert>
						</form>
					</Form>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Confirm hire</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<div className="flex items-center justify-between">
								<span>Domain</span>
								<span className="font-medium">{listing.domainId}</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Hire type</span>
								<span className="capitalize">
									{selectedType === "period" ? "Monthly" : "Per click"}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Price</span>
								<span className="font-medium">
									{selectedType === "period" ? periodPrice ?? "N/A" : clickPrice ?? "N/A"}
								</span>
							</div>
						</CardContent>
						<CardFooter className="flex flex-col items-stretch gap-2">
							<Alert>
								<AlertTitle>Heads up</AlertTitle>
								<AlertDescription>
									Routing configuration and analytics are coming in the next release.
								</AlertDescription>
							</Alert>
						</CardFooter>
					</Card>
				)}
				<DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
					{step === 1 ? (
						<>
							<Button
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								variant="default"
								disabled={!(selectedType === "period" ? canSelectPeriod : canSelectPerClick)}
								onClick={() => setStep(2)}
							>
								Continue
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
								Back
							</Button>
							<Button
								onClick={() => form.handleSubmit(handleSubmit)()}
								disabled={isSubmitting}
						>
								{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Confirm hire
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


