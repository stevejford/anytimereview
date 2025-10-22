'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2, Copy, CheckCircle2, AlertCircle, Clock, Info } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import type { Domain } from '@/lib/api-client';

type VerificationMethod = 'cf_saas' | 'domain_connect' | 'manual';

interface VerificationInstructionsProps {
	method: VerificationMethod;
	domain: Domain;
	verificationData: {
		txtRecord?: { name: string; value: string } | null;
		httpToken?: { url: string; body: string } | null;
		domainConnectUrl?: string;
		manualInstructions?: { type: string; cnameTarget?: string } | null;
	};
	onCheckStatus: () => void;
	isChecking?: boolean;
}

export function VerificationInstructions({
	method,
	domain,
	verificationData,
	onCheckStatus,
	isChecking,
}: VerificationInstructionsProps) {
	const [autoCheckCountdown, setAutoCheckCountdown] = useState(10);
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(async (value?: string | null) => {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (error) {
			console.error('Failed to copy value to clipboard', error);
		}
	}, []);

	// Auto-check countdown timer
	useEffect(() => {
		if (domain.verificationStatus === 'pending') {
			const interval = setInterval(() => {
				setAutoCheckCountdown((prev) => {
					if (prev <= 1) {
						onCheckStatus();
						return 10;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(interval);
		}
	}, [domain.verificationStatus, onCheckStatus]);

	const getStatusIcon = () => {
		switch (domain.verificationStatus) {
			case 'verified':
				return <CheckCircle2 className="h-4 w-4" />;
			case 'failed':
				return <AlertCircle className="h-4 w-4" />;
			default:
				return <Clock className="h-4 w-4" />;
		}
	};

	const getStatusBadgeVariant = () => {
		switch (domain.verificationStatus) {
			case 'verified':
				return 'default';
			case 'failed':
				return 'destructive';
			default:
				return 'pending';
		}
	};

	return (
		<Card className={domain.verificationStatus === 'pending' ? 'animate-pulse' : ''}>
			<CardHeader>
				<CardTitle className="flex items-center justify-between text-lg">
					<span>Verification Instructions</span>
					<Badge variant={getStatusBadgeVariant()} className="gap-1" aria-live="polite">
						{getStatusIcon()}
						{domain.verificationStatus.toUpperCase()}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Skeleton loader during status check */}
				{isChecking && (
					<div className="space-y-4 animate-in fade-in-50">
						<Skeleton className="h-32 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-10 w-full" />
					</div>
				)}

				{!isChecking && (
					<>

				{method === 'cf_saas' && (
					<div className="space-y-4">
						{verificationData.txtRecord && (
							<Alert className="border-secondary/30">
								<Info className="h-4 w-4 text-secondary" />
								<AlertTitle className="text-base">Add TXT Record</AlertTitle>
								<AlertDescription className="space-y-3">
									<p className="text-base">
										Add the following TXT record to your DNS for <strong>{domain.fqdn}</strong>:
									</p>
									<div className="rounded-md border border-primary/20 bg-muted/50 p-4 text-sm">
										<p className="mb-2">
											<strong>Name:</strong> {verificationData.txtRecord.name}
										</p>
										<p className="flex items-center gap-2">
											<strong>Value:</strong>
											<code className="flex-1 rounded bg-background px-2 py-1">{verificationData.txtRecord.value}</code>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopy(verificationData.txtRecord?.value)}
												className="hover:bg-primary/10 hover:text-primary"
											>
												{copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
												<span className="sr-only">Copy TXT value</span>
											</Button>
										</p>
									</div>
								</AlertDescription>
							</Alert>
						)}
						{verificationData.httpToken && (
							<Alert className="border-secondary/30">
								<Info className="h-4 w-4 text-secondary" />
								<AlertTitle className="text-base">HTTP Verification</AlertTitle>
								<AlertDescription className="space-y-3">
									<p className="text-base">
										Serve the following content at the path below:
									</p>
									<div className="rounded-md border border-primary/20 bg-muted/50 p-4 text-sm">
										<p className="mb-2">
											<strong>URL:</strong>
											<code className="ml-2 rounded bg-background px-2 py-1">{verificationData.httpToken.url}</code>
										</p>
										<p className="flex items-center gap-2">
											<strong>Body:</strong>
											<code className="flex-1 rounded bg-background px-2 py-1">{verificationData.httpToken.body}</code>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCopy(verificationData.httpToken?.body)}
												className="hover:bg-primary/10 hover:text-primary"
											>
												{copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
												<span className="sr-only">Copy HTTP token</span>
											</Button>
										</p>
									</div>
								</AlertDescription>
							</Alert>
						)}
						<p className="flex items-center gap-2 text-base text-secondary">
							<Info className="h-4 w-4" />
							After updating DNS records, propagation can take up to an hour depending on the provider.
						</p>
					</div>
				)}

				{method === 'domain_connect' && (
					<Alert className="border-secondary/30">
						<Info className="h-4 w-4 text-secondary" />
						<AlertTitle className="text-base">Domain Connect</AlertTitle>
						<AlertDescription className="space-y-4">
							<p className="text-base">
								Domain Connect streamlines DNS configuration for supported registrars. Clicking the button below opens your registrar for authorization.
							</p>
							{verificationData.domainConnectUrl && (
								<Button
									asChild
									size="lg"
									className="shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal"
								>
									<a href={verificationData.domainConnectUrl} target="_blank" rel="noreferrer">
										Authorize DNS Changes
										<ExternalLink className="ml-2 h-4 w-4" />
									</a>
								</Button>
							)}
							<p className="flex items-center gap-2 text-base text-secondary">
								<Info className="h-4 w-4" />
								If Domain Connect is not supported, return and choose the manual method instead.
							</p>
						</AlertDescription>
					</Alert>
				)}

				{method === 'manual' && (
					<Alert className="border-secondary/30">
						<Info className="h-4 w-4 text-secondary" />
						<AlertTitle className="text-base">Manual DNS Configuration</AlertTitle>
						<AlertDescription className="space-y-4">
							<p className="text-base">
								Create a CNAME record pointing <strong>{domain.fqdn}</strong> to the Cloudflare fallback origin provided below. If your DNS provider does not support CNAME at the apex, configure equivalent A/AAAA records pointing to the mapped IPs.
							</p>
							{verificationData.manualInstructions?.cnameTarget && (
								<div className="rounded-md border border-primary/20 bg-muted/50 p-4 text-sm">
									<p className="flex items-center gap-2">
										<strong>Target:</strong>
										<code className="flex-1 rounded bg-background px-2 py-1">{verificationData.manualInstructions.cnameTarget}</code>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleCopy(verificationData.manualInstructions?.cnameTarget)}
											className="hover:bg-primary/10 hover:text-primary"
										>
											{copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
											<span className="sr-only">Copy CNAME target</span>
										</Button>
									</p>
								</div>
							)}
							<p className="flex items-center gap-2 text-base text-secondary">
								<Info className="h-4 w-4" />
								DNS changes may require TTL expiry before verification succeeds.
							</p>
						</AlertDescription>
					</Alert>
				)}

				{/* Failed State with Retry Options */}
				{domain.verificationStatus === 'failed' && (
					<Alert variant="destructive" className="bg-destructive/10">
						<AlertCircle className="h-5 w-5" />
						<AlertTitle className="text-base">Verification Failed</AlertTitle>
						<AlertDescription className="space-y-3">
							<p>
								The verification could not be completed. Please check your DNS configuration and try again.
							</p>
							<div className="flex gap-2">
								<Button
									variant="default"
									size="sm"
									onClick={onCheckStatus}
									className="shadow-sm"
								>
									Retry Verification
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => window.location.reload()}
									className="hover:bg-secondary/10 hover:text-secondary hover:border-secondary"
								>
									Try Different Method
								</Button>
							</div>
						</AlertDescription>
					</Alert>
				)}

				<div className="flex items-center justify-between gap-4 pt-2">
					{domain.verificationStatus === 'pending' && (
						<p className="text-sm text-muted-foreground flex items-center gap-2">
							<Clock className="h-4 w-4 text-secondary animate-pulse" />
							Auto-checking in {autoCheckCountdown}s...
						</p>
					)}
					<div className="flex-1" />
					<div className="relative">
						{/* Progress ring around button */}
						{domain.verificationStatus === 'pending' && !isChecking && (
							<div
								className="absolute inset-0 rounded-lg pointer-events-none"
								style={{
									background: `conic-gradient(
										hsl(var(--secondary)) ${((10 - autoCheckCountdown) / 10) * 360}deg,
										transparent ${((10 - autoCheckCountdown) / 10) * 360}deg
									)`,
									padding: '2px',
									WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
									WebkitMaskComposite: 'xor',
									maskComposite: 'exclude',
								}}
							/>
						)}
						<Button
							variant="outline"
							onClick={onCheckStatus}
							disabled={isChecking}
							size="lg"
							className="shadow-sm transition-all duration-200 hover:bg-secondary/10 hover:text-secondary hover:border-secondary hover:shadow-md relative"
						>
							{isChecking ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Checking status...
								</>
							) : (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Check Verification Status
								</>
							)}
						</Button>
					</div>
				</div>
				</>
				)}
			</CardContent>
		</Card>
	);
}



