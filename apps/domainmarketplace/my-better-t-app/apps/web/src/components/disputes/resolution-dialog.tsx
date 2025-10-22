"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";

import { resolveDispute, type Dispute } from "@/lib/api-client";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
	status: z.enum(["resolved", "rejected"]),
	resolution: z.string().min(10, "Resolution notes are required").max(2000),
	creditAmountCents: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ResolutionDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	dispute: Dispute | null;
	onSuccess: () => void;
}

export function ResolutionDialog({
	isOpen,
	onOpenChange,
	dispute,
	onSuccess,
}: ResolutionDialogProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			status: "resolved",
			resolution: "",
			creditAmountCents: undefined,
		},
	});

	const watchedStatus = form.watch("status");

	React.useEffect(() => {
		if (dispute) {
			form.reset({
				status: "resolved",
				resolution: "",
				creditAmountCents: undefined,
			});
			setError(null);
		}
	}, [dispute, form]);

	const handleSubmit = async (values: FormValues) => {
		if (isSubmitting || !dispute) return;

		setIsSubmitting(true);
		setError(null);

		try {
			await resolveDispute(dispute.id, {
				status: values.status,
				resolution: values.resolution,
				creditAmountCents: values.creditAmountCents,
			});
			onSuccess();
			onOpenChange(false);
			form.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to resolve dispute");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!dispute) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Resolve Dispute</DialogTitle>
					<DialogDescription>
						Dispute #{dispute.id} • {dispute.hire?.listing?.domain?.fqdn ?? "Unknown domain"}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<Card>
					<CardContent className="pt-6 space-y-2">
						<div className="grid grid-cols-2 gap-2 text-sm">
							<div>
								<span className="font-semibold">Filed by:</span>{" "}
								{dispute.claimantRole.charAt(0).toUpperCase() + dispute.claimantRole.slice(1)}
							</div>
							<div>
								<span className="font-semibold">Category:</span>{" "}
								{dispute.category ? dispute.category.toUpperCase() : "Uncategorized"}
							</div>
						</div>
						<div>
							<span className="font-semibold">Reason:</span>
							<p className="text-sm text-muted-foreground mt-1">
								{dispute.reason.length > 200
									? `${dispute.reason.slice(0, 200)}...`
									: dispute.reason}
							</p>
						</div>
						<div className="text-sm text-muted-foreground">
							Filed on {format(new Date(dispute.createdAt), "MMM dd, yyyy 'at' h:mm a")}
						</div>
					</CardContent>
				</Card>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="status"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Resolution Decision</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-2"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="resolved" id="resolved" />
												<Label htmlFor="resolved">Approve & Issue Credit</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="rejected" id="rejected" />
												<Label htmlFor="rejected">Deny Dispute</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="resolution"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Resolution Notes</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Explain the resolution decision and actions taken..."
											rows={4}
										/>
									</FormControl>
									<FormDescription>
										This will be visible to the claimant
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{watchedStatus === "resolved" && (
							<FormField
								control={form.control}
								name="creditAmountCents"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Credit Amount (cents)</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="number"
												placeholder="0"
												min="0"
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Credit amount in cents (leave empty for no credit)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Resolve Dispute
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

