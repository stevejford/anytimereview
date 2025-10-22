"use client";

import { useState, useEffect } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ModerationDialogProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	actionLabel: string;
	actionVariant?: "default" | "destructive";
	requireReason?: boolean;
	onConfirm: (reason?: string) => void;
	isLoading?: boolean;
}

export function ModerationDialog({
	isOpen,
	onOpenChange,
	title,
	description,
	actionLabel,
	actionVariant = "default",
	requireReason = false,
	onConfirm,
	isLoading = false,
}: ModerationDialogProps) {
	const [reason, setReason] = useState("");

	useEffect(() => {
		if (!isOpen) {
			setReason("");
		}
	}, [isOpen]);

	const handleConfirm = () => {
		onConfirm(reason || undefined);
		setReason("");
	};

	const isDisabled = isLoading || (requireReason && (reason.length < 10 || reason.length > 500));

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				{requireReason && (
					<div className="space-y-2">
						<Label htmlFor="reason">Reason</Label>
						<Textarea
							id="reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							placeholder="Enter a detailed reason (minimum 10 characters)"
							rows={4}
							disabled={isLoading}
							maxLength={500}
						/>
						<p className="text-sm text-muted-foreground">
							{reason.length}/500 characters (maximum 500)
						</p>
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isDisabled}
						className={
							actionVariant === "destructive"
								? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
								: ""
						}
					>
						{isLoading ? "Processing..." : actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

