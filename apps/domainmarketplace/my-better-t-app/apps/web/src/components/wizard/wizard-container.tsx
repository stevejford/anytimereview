"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";

export interface WizardStep {
	id: string;
	title: string;
	description?: string;
	content: React.ReactNode;
	optional?: boolean;
}

interface WizardContainerProps {
	steps: WizardStep[];
	currentStep: number;
	onStepChange: (step: number) => void;
	onComplete: () => void;
	canGoNext?: boolean;
	canGoBack?: boolean;
	isLoading?: boolean;
	title?: string;
	description?: string;
}

export function WizardContainer({
	steps,
	currentStep,
	onStepChange,
	onComplete,
	canGoNext = true,
	canGoBack = true,
	isLoading = false,
	title,
	description,
}: WizardContainerProps) {
	const progress = ((currentStep + 1) / steps.length) * 100;
	const isFirstStep = currentStep === 0;
	const isLastStep = currentStep === steps.length - 1;
	const currentStepData = steps[currentStep];

	const handleNext = () => {
		if (isLastStep) {
			onComplete();
		} else {
			onStepChange(currentStep + 1);
		}
	};

	const handleBack = () => {
		if (!isFirstStep) {
			onStepChange(currentStep - 1);
		}
	};

	return (
		<div className="mx-auto w-full max-w-3xl space-y-6">
			{title && (
				<div className="space-y-2">
					<h1 className="text-3xl font-bold">{title}</h1>
					{description && <p className="text-muted-foreground">{description}</p>}
				</div>
			)}

			<div className="space-y-2">
				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						Step {currentStep + 1} of {steps.length}
					</span>
					<span className="font-medium">{Math.round(progress)}%</span>
				</div>
				<Progress value={progress} className="h-2" />
			</div>

			<div className="flex gap-2 overflow-x-auto pb-2">
				{steps.map((step, index) => (
					<button
						key={step.id}
						onClick={() => index < currentStep && onStepChange(index)}
						disabled={index > currentStep}
						aria-current={index === currentStep ? "step" : undefined}
						aria-disabled={index > currentStep}
						className={`flex-shrink-0 rounded-lg border px-4 py-2 text-left transition-colors ${
							index === currentStep
								? "border-primary bg-primary/5"
								: index < currentStep
									? "border-primary bg-primary/10 hover:bg-primary/20"
									: "border-muted bg-muted/30"
						}`}
					>
						<div className="flex items-center gap-2">
							{index < currentStep && (
								<div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
									<Check className="h-3 w-3" />
								</div>
							)}
							<div>
								<div className="text-xs font-medium">{step.title}</div>
								{step.optional && <div className="text-xs text-muted-foreground">Optional</div>}
							</div>
						</div>
					</button>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{currentStepData.title}</CardTitle>
					{currentStepData.description && (
						<CardDescription>{currentStepData.description}</CardDescription>
					)}
				</CardHeader>
				<CardContent>{currentStepData.content}</CardContent>
				<CardFooter className="flex justify-between">
					<Button
						variant="outline"
						onClick={handleBack}
						disabled={isFirstStep || !canGoBack || isLoading}
					>
						<ChevronLeft className="mr-2 h-4 w-4" />
						Back
					</Button>
					<Button onClick={handleNext} disabled={!canGoNext || isLoading}>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
								Loading...
							</>
						) : isLastStep ? (
							<>
								<Check className="mr-2 h-4 w-4" />
								Complete
							</>
						) : (
							<>
								Next
								<ChevronRight className="ml-2 h-4 w-4" />
							</>
						)}
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}


