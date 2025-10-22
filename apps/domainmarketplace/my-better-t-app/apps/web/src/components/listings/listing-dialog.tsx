"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Domain, Listing } from "@/lib/api-client";
import { createListing, updateListing } from "@/lib/api-client";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z
	.object({
		domainId: z.string().min(1, "Domain is required"),
		mode: z.enum(["exclusive", "shared_slugs"]),
		pricePeriodCents: z
			.union([z.coerce.number().min(0), z.literal("")])
			.optional()
			.transform((value) => (value === "" ? undefined : value)),
		priceClickCents: z
			.union([z.coerce.number().min(0), z.literal("")])
			.optional()
			.transform((value) => (value === "" ? undefined : value)),
	})
	.refine(
		(data) => data.pricePeriodCents !== undefined || data.priceClickCents !== undefined,
		{
			message: "At least one pricing option is required",
			path: ["pricePeriodCents"],
		},
	);

type FormValues = z.infer<typeof formSchema>;

interface ListingDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	listing?: Listing | null;
	domains: Domain[];
	onSuccess: () => void;
}

export function ListingDialog({
	isOpen,
	onOpenChange,
	listing,
	domains,
	onSuccess,
}: ListingDialogProps) {
	const [error, setError] = React.useState<string | null>(null);
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: listing
			? {
				domainId: listing.domainId,
				mode: listing.mode,
				pricePeriodCents: listing.pricePeriodCents ?? undefined,
				priceClickCents: listing.priceClickCents ?? undefined,
			}
			: {
				domainId: "",
				mode: "exclusive",
				pricePeriodCents: undefined,
				priceClickCents: undefined,
			},
	});

	const isEditMode = Boolean(listing);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	React.useEffect(() => {
		if (listing) {
			form.reset({
				domainId: listing.domainId,
				mode: listing.mode,
				pricePeriodCents: listing.pricePeriodCents ?? undefined,
				priceClickCents: listing.priceClickCents ?? undefined,
			});
		} else {
			form.reset({
				domainId: "",
				mode: "exclusive",
				pricePeriodCents: undefined,
				priceClickCents: undefined,
			});
		}
	}, [listing, form]);

	const onSubmit = form.handleSubmit(async (values) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError(null);
		try {
			if (isEditMode && listing) {
			await updateListing(listing.id, {
				status: listing.status,
				pricePeriodCents: values.pricePeriodCents ?? null,
				priceClickCents: values.priceClickCents ?? null,
			});
			} else {
				await createListing({
					domainId: values.domainId,
					mode: values.mode,
				pricePeriodCents: values.pricePeriodCents,
				priceClickCents: values.priceClickCents,
				});
			}
			onSuccess();
			onOpenChange(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save listing");
		} finally {
			setIsSubmitting(false);
		}
	});

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{isEditMode ? "Edit Listing" : "Create Listing"}</DialogTitle>
				</DialogHeader>
				{error && (
					<Alert variant="destructive" className="mb-4">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
				<Form {...form}>
					<form onSubmit={onSubmit} className="space-y-6">
						<FormField
							control={form.control}
							name="domainId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Domain</FormLabel>
									<FormControl>
										<Select
											disabled={isEditMode}
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a domain" />
											</SelectTrigger>
											<SelectContent>
												{domains.map((domain) => (
													<SelectItem key={domain.id} value={domain.id}>
														{domain.fqdn}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="mode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Mode</FormLabel>
									<FormControl>
										<Select
											disabled={isEditMode}
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="exclusive">Exclusive</SelectItem>
												<SelectItem value="shared_slugs">Shared Slugs</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="pricePeriodCents"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Monthly price (cents)</FormLabel>
										<FormControl>
											<Input type="number" inputMode="numeric" placeholder="5000" {...field} />
										</FormControl>
										<FormDescription>Charge hirers a monthly fee.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="priceClickCents"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Per-click price (cents)</FormLabel>
										<FormControl>
											<Input type="number" inputMode="numeric" placeholder="100" {...field} />
										</FormControl>
										<FormDescription>Charge hirers per click.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										<span>{isEditMode ? "Updating" : "Creating"}</span>
									</>
								) : (
									<span>{isEditMode ? "Update listing" : "Create listing"}</span>
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

