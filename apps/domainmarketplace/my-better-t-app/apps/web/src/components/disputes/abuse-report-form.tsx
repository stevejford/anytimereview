"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createDispute, type Hire } from "@/lib/api-client";
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
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
	hireId: z.string(),
	category: z.enum(["ivt", "quality", "billing", "other"]),
	reason: z.string().min(10, "Please describe the issue in detail").max(2000),
});

type FormValues = z.infer<typeof formSchema>;

interface AbuseReportFormProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	hire: Hire;
	onSuccess: () => void;
}

export function AbuseReportForm({
	isOpen,
	onOpenChange,
	hire,
	onSuccess,
}: AbuseReportFormProps) {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			hireId: hire.id,
			category: "ivt",
			reason: "",
		},
	});

	React.useEffect(() => {
		if (hire) {
			form.reset({
				hireId: hire.id,
				category: "ivt",
				reason: "",
			});
			setError(null);
		}
	}, [hire, form]);

	const handleSubmit = async (values: FormValues) => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		setError(null);

		try {
			await createDispute({
				hireId: values.hireId,
				reason: values.reason,
				category: values.category,
			});
			onSuccess();
			onOpenChange(false);
			form.reset();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to submit dispute");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Report Issue</DialogTitle>
					<DialogDescription>File a dispute for this hire</DialogDescription>
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
								<span className="font-semibold">Domain:</span>{" "}
								<span className="font-mono">
									{hire.listing?.domain?.fqdn ?? "Unknown"}
								</span>
							</div>
							<div>
								<span className="font-semibold">Hire Type:</span>{" "}
								<Badge variant="outline">
									{hire.type === "per_click" ? "Per-Click" : "Period"}
								</Badge>
							</div>
						</div>
						<div>
							<span className="font-semibold">Status:</span>{" "}
							<Badge>{hire.status}</Badge>
						</div>
					</CardContent>
				</Card>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="category"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Issue Category</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a category" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="ivt">
												Invalid Traffic / Bot Clicks
											</SelectItem>
											<SelectItem value="quality">
												Service Quality Issue
											</SelectItem>
											<SelectItem value="billing">Billing Dispute</SelectItem>
											<SelectItem value="other">Other Issue</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="reason"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Describe the issue in detail. Include specific examples, dates, and any evidence..."
											rows={6}
										/>
									</FormControl>
									<FormDescription>
										Provide as much detail as possible to help us investigate
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Alert>
							<AlertDescription>
								Your dispute will be reviewed by our Trust & Safety team within 3
								business days. You will receive updates via email.
							</AlertDescription>
						</Alert>

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
								Submit Dispute
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}

