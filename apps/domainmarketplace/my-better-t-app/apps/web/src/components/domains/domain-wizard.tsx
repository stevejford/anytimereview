'use client';

import { useCallback, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, ChevronLeft, Globe, Shield, AlertCircle, Check, X, Info, Zap, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { createDomain, verifyDomain, getDomainStatus, type Domain } from '@/lib/api-client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import { VerificationInstructions } from './verification-instructions';

const fqdnSchema = z.object({
	fqdn: z
		.string()
		.trim()
		.min(4, 'Domain must be at least 4 characters')
		.regex(/^(?=.{1,253}$)(?!-)([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Enter a valid domain name'),
});

const methods = [
	{
		value: 'cf_saas' as const,
		title: 'Cloudflare SaaS',
		description:
			'Automatic SSL and edge routing via Cloudflare Custom Hostnames with DNS TXT/HTTP pre-validation.',
		icon: Zap,
		recommended: true,
		estimatedTime: '5-10 minutes',
	},
	{
		value: 'domain_connect' as const,
		title: 'Domain Connect',
		description:
			'Redirects to your registrar for automated DNS updates when Domain Connect is supported.',
		icon: Settings,
		recommended: false,
		estimatedTime: '2-5 minutes',
	},
	{
		value: 'manual' as const,
		title: 'Manual DNS',
		description:
			'Manually configure DNS records (CNAME/A) pointing to the Cloudflare fallback origin.',
		icon: Globe,
		recommended: false,
		estimatedTime: '10-30 minutes',
	},
];

type WizardStep = 1 | 2 | 3;

interface DomainWizardProps {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

export function DomainWizard({ isOpen, onOpenChange }: DomainWizardProps) {
	const [step, setStep] = useState<WizardStep>(1);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isVerifying, setIsVerifying] = useState(false);
	const [selectedMethod, setSelectedMethod] = useState<(typeof methods)[number]['value']>('cf_saas');
	const [domainRecord, setDomainRecord] = useState<Domain | null>(null);
	const [verificationData, setVerificationData] = useState<{
		txtRecord?: { name: string; value: string } | null;
		httpToken?: { url: string; body: string } | null;
		domainConnectUrl?: string;
		manualInstructions?: { type: string; cnameTarget?: string } | null;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<z.infer<typeof fqdnSchema>>({
		resolver: zodResolver(fqdnSchema),
		defaultValues: {
			fqdn: '',
		},
	});

	const resetState = useCallback(() => {
		setStep(1);
		setIsSubmitting(false);
		setIsVerifying(false);
		setSelectedMethod('cf_saas');
		setDomainRecord(null);
		setVerificationData(null);
		setError(null);
		form.reset();
	}, [form]);

	// Determine if dialog can be closed (only when verified)
	const canClose = useMemo(() => domainRecord?.verificationStatus === 'verified', [domainRecord]);

	const handleOpenChange = useCallback(
		(value: boolean) => {
			// Prevent closing until verification is complete
			if (!value && !canClose) {
				return;
			}
			onOpenChange(value);
			if (!value) {
				resetState();
			}
		},
		[onOpenChange, resetState, canClose],
	);

	const handleCreateDomain = form.handleSubmit(async (data) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setError(null);
		try {
			const domain = await createDomain(data.fqdn);
			setDomainRecord(domain);
			setStep(2);
		} catch (err) {
			console.error(err);
			setError('Unable to create domain. Please verify the domain is valid and not already registered.');
		} finally {
			setIsSubmitting(false);
		}
	});

	const handleVerifyDomain = useCallback(async () => {
		if (!domainRecord) return;
		setIsVerifying(true);
		setError(null);
		try {
			const response = await verifyDomain(domainRecord.id, {
				method: selectedMethod,
				returnUrl: typeof window !== 'undefined' ? window.location.href : null,
			});
			setVerificationData({
				txtRecord: response.txtRecord ?? undefined,
				httpToken: response.httpToken ?? undefined,
				domainConnectUrl: response.redirectUrl,
				manualInstructions: response.instructions ? { ...response.instructions } : undefined,
			});
			setStep(3);
		} catch (err) {
			console.error(err);
			setError('Verification could not be started. Try again or select a different method.');
		} finally {
			setIsVerifying(false);
		}
	}, [domainRecord, selectedMethod]);

	const handleCheckStatus = useCallback(async () => {
		if (!domainRecord) return;
		setIsVerifying(true);
		try {
			const updated = await getDomainStatus(domainRecord.id);
			setDomainRecord(updated);
		} catch (err) {
			console.error(err);
		} finally {
			setIsVerifying(false);
		}
	}, [domainRecord]);

	const progress = ((step - 1) / 2) * 100;

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogContent size="4xl" showCloseButton={canClose}>
				<DialogHeader>
					<DialogTitle>Add a Domain</DialogTitle>
					<DialogDescription>
						Complete the steps below to onboard your domain to the marketplace.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					{/* Visual Step Indicators */}
					<div className="space-y-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
							{/* Step 1 */}
							<div className="flex flex-1 items-center gap-3">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
										step > 1
											? 'border-primary bg-primary/10'
											: step === 1
												? 'border-primary bg-card'
												: 'border-muted bg-muted/30'
									}`}
									aria-current={step === 1 ? 'step' : undefined}
								>
									{step > 1 ? (
										<Check className="h-5 w-5 text-primary" />
									) : (
										<Globe className={`h-5 w-5 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`} />
									)}
								</div>
								<div className="flex-1">
									<p className={`text-sm font-medium ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
										Enter Domain
									</p>
								</div>
							</div>

							{/* Connector Line - Vertical on mobile, horizontal on desktop */}
							<div className={`w-0.5 h-8 sm:w-12 sm:h-0.5 ml-5 sm:ml-0 transition-all duration-200 ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />

							{/* Step 2 */}
							<div className="flex flex-1 items-center gap-3">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
										step > 2
											? 'border-primary bg-primary/10'
											: step === 2
												? 'border-primary bg-card'
												: 'border-muted bg-muted/30'
									}`}
									aria-current={step === 2 ? 'step' : undefined}
								>
									{step > 2 ? (
										<Check className="h-5 w-5 text-primary" />
									) : (
										<Shield className={`h-5 w-5 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`} />
									)}
								</div>
								<div className="flex-1">
									<p className={`text-sm font-medium ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
										Verify Ownership
									</p>
								</div>
							</div>

							{/* Connector Line - Vertical on mobile, horizontal on desktop */}
							<div className={`w-0.5 h-8 sm:w-12 sm:h-0.5 ml-5 sm:ml-0 transition-all duration-200 ${step > 2 ? 'bg-primary' : 'bg-muted'}`} />

							{/* Step 3 */}
							<div className="flex flex-1 items-center gap-3">
								<div
									className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
										canClose
											? 'border-primary bg-primary/10'
											: step === 3
												? 'border-primary bg-card'
												: 'border-muted bg-muted/30'
									}`}
									aria-current={step === 3 ? 'step' : undefined}
								>
									{canClose ? (
										<Check className="h-5 w-5 text-primary" />
									) : (
										<CheckCircle2 className={`h-5 w-5 ${step === 3 ? 'text-primary' : 'text-muted-foreground'}`} />
									)}
								</div>
								<div className="flex-1">
									<p className={`text-sm font-medium ${step >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
										Complete Setup
									</p>
								</div>
							</div>
						</div>

						{/* Progress Bar */}
						<div className="space-y-2">
							<Progress value={progress} className="h-2" />
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>Step {step} of 3</span>
								<span>{Math.round(progress)}% complete</span>
							</div>
						</div>
					</div>

					{error && (
						<Alert variant="destructive" className="animate-in fade-in-50 duration-200">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription className="font-medium">{error}</AlertDescription>
						</Alert>
					)}

					{/* Skeleton loader during submission */}
					{isSubmitting && step === 1 && (
						<Card className="animate-in fade-in-50">
							<CardHeader>
								<Skeleton className="h-6 w-48" />
								<Skeleton className="h-4 w-full mt-2" />
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-12 w-full" />
								</div>
								<Skeleton className="h-10 w-24 ml-auto" />
							</CardContent>
						</Card>
					)}

					{step === 1 && !isSubmitting && (
						<Card className="transition-all duration-200 animate-in fade-in-50">
							<CardHeader>
								<div className="flex items-center gap-2">
									<Globe className="h-5 w-5 text-primary" />
									<CardTitle className="text-xl font-semibold">Enter Domain</CardTitle>
								</div>
								<CardDescription>
									Enter the fully qualified domain name you want to add to the marketplace
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Form {...form}>
									<form onSubmit={handleCreateDomain} className="space-y-4">
										<FormField
											control={form.control}
											name="fqdn"
											render={({ field }) => {
												const isValid = field.value && !form.formState.errors.fqdn;
												const hasError = form.formState.errors.fqdn;

												return (
													<FormItem>
														<FormLabel className="text-base">Domain name</FormLabel>
														<div className="relative">
															<FormControl>
																<Input
																	placeholder="example.com"
																	autoFocus
																	className={`h-12 pr-10 text-lg transition-all duration-200 ${
																		isValid
																			? 'border-primary/50 focus-visible:ring-primary/30'
																			: hasError
																				? 'border-destructive/50'
																				: ''
																	}`}
																	{...field}
																/>
															</FormControl>
															{field.value && (
																<div className="absolute right-3 top-1/2 -translate-y-1/2">
																	{isValid ? (
																		<Check className="h-5 w-5 text-primary" />
																	) : hasError ? (
																		<X className="h-5 w-5 text-destructive" />
																	) : null}
																</div>
															)}
														</div>
														<div className="space-y-1">
															<p className="text-sm text-muted-foreground flex items-center gap-1">
																<Info className="h-3 w-3" />
																Example: example.com or subdomain.example.com
															</p>
															{isValid && (
																<p className="text-sm text-primary font-medium animate-in fade-in-50">
																	✓ Valid domain format
																</p>
															)}
														</div>
														<FormMessage className="text-destructive font-medium" />
													</FormItem>
												);
											}}
										/>
										<div className="flex justify-end gap-2 pt-2">
											<Button
												type="submit"
												disabled={isSubmitting}
												size="lg"
												className="shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal"
											>
												{isSubmitting ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
														Creating domain...
													</>
												) : (
													'Next'
												)}
											</Button>
										</div>
									</form>
								</Form>
							</CardContent>
						</Card>
					)}

					{/* Skeleton loader during verification start */}
					{isVerifying && step === 2 && (
						<Card className="animate-in fade-in-50">
							<CardHeader>
								<Skeleton className="h-6 w-56" />
								<Skeleton className="h-4 w-full mt-2" />
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-24 w-full" />
								<Skeleton className="h-24 w-full" />
								<Skeleton className="h-24 w-full" />
								<Skeleton className="h-10 w-32 ml-auto" />
							</CardContent>
						</Card>
					)}

					{step === 2 && domainRecord && !isVerifying && (
						<Card className="transition-all duration-200 animate-in fade-in-50">
							<CardHeader className="flex flex-row items-center justify-between space-y-0">
								<div className="flex items-center gap-2">
									<Shield className="h-5 w-5 text-primary" />
									<div>
										<CardTitle className="text-xl font-semibold">Select verification method</CardTitle>
										<CardDescription className="mt-1">
											Choose how you want to verify ownership of {domainRecord.fqdn}
										</CardDescription>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setStep(1)}
									className="hover:bg-secondary/10 hover:text-secondary"
								>
									<ChevronLeft className="mr-1 h-4 w-4" /> Back
								</Button>
							</CardHeader>
							<CardContent className="space-y-6">
								<RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
									<div className="space-y-3">
										{methods.map((method) => {
											const Icon = method.icon;
											const isSelected = selectedMethod === method.value;

											return (
												<Label
													key={method.value}
													htmlFor={method.value}
													className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 transition-all duration-200 ${
														isSelected
															? 'border-primary bg-primary/5 shadow-md shadow-teal'
															: 'border-border hover:border-primary/50 hover:shadow-md'
													}`}
												>
													<RadioGroupItem value={method.value} id={method.value} className="mt-1" />
													<div className="flex-1 space-y-2">
														<div className="flex items-center gap-2">
															<Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
															<div className="flex items-center gap-2">
																<span className="font-semibold">{method.title}</span>
																{method.recommended && (
																	<Badge variant="default" className="text-xs">
																		Recommended
																	</Badge>
																)}
															</div>
														</div>
														<p className="text-sm text-muted-foreground">{method.description}</p>
														<p className="text-xs text-secondary flex items-center gap-1">
															<Info className="h-3 w-3" />
															Estimated time: {method.estimatedTime}
														</p>
													</div>
												</Label>
											);
										})}
									</div>
								</RadioGroup>

								<div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
									<p className="text-sm text-muted-foreground flex items-center gap-2">
										<Info className="h-4 w-4 text-secondary" />
										Need help choosing?{' '}
										<a href="#" className="text-secondary hover:underline font-medium">
											View documentation
										</a>
									</p>
								</div>

								<div className="flex justify-end pt-2">
									<Button
										onClick={handleVerifyDomain}
										disabled={isVerifying}
										size="lg"
										className="shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal"
									>
										{isVerifying ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
												Starting verification...
											</>
										) : (
											'Start Verification'
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{step === 3 && domainRecord && verificationData && (
						<div className="space-y-4 transition-all duration-200 animate-in fade-in-50">
							{canClose && (
								<Alert className="border-primary bg-primary/10 animate-in zoom-in-95 duration-300">
									<CheckCircle2 className="h-5 w-5 text-primary" />
									<AlertDescription className="font-medium text-primary">
										🎉 Domain verified successfully! You can now close this dialog.
									</AlertDescription>
								</Alert>
							)}

							<VerificationInstructions
								method={selectedMethod}
								domain={domainRecord}
								verificationData={verificationData}
								onCheckStatus={handleCheckStatus}
								isChecking={isVerifying}
							/>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant={canClose ? 'default' : 'outline'}
						onClick={() => handleOpenChange(false)}
						disabled={!canClose}
						size="lg"
						className={canClose ? 'shadow-md hover:shadow-lg hover:shadow-teal' : ''}
					>
						{canClose ? 'Continue' : 'Close'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}


