"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMode } from "@/lib/hooks/use-mode";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle,
	DollarSign,
	Shield,
	Zap,
	TrendingUp,
	ArrowRight,
} from "lucide-react";

export default function ListYourDomainPage() {
	const { user, isLoaded, isSignedIn } = useUser();
	const { hasCompletedOnboarding } = useMode();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			if (hasCompletedOnboarding) {
				router.push("/host/dashboard");
			} else {
				router.push("/onboarding");
			}
		}
	}, [isLoaded, isSignedIn, hasCompletedOnboarding, router]);

	// Show landing page only for non-authenticated users
	if (isLoaded && isSignedIn) {
		return null; // Will redirect
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Hero Section */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto max-w-7xl px-4">
					<div className="text-center">
						<Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
							Start Earning Today
						</Badge>
						<h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
							Earn Passive Income from Your{" "}
							<span className="text-primary">Premium Domains</span>
						</h1>
						<p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
							Join thousands of domain owners earning monthly revenue by listing
							their domains on our marketplace
						</p>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<Button
								asChild
								size="lg"
								className="gap-2"
								aria-label="Get started with domain listing"
							>
								<Link href="/login?redirect=/onboarding">
									Get Started
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={() => {
									document
										.getElementById("how-it-works")
										?.scrollIntoView({ behavior: "smooth" });
								}}
							>
								Learn How It Works
							</Button>
						</div>
					</div>
				</div>
			</section>

			{/* Benefits Section */}
			<section className="py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						Why List Your Domain With Us?
					</h2>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<Card className="interactive">
							<CardHeader>
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Zap className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Quick Setup</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Get listed in under 10 minutes with our streamlined onboarding
									process
								</p>
							</CardContent>
						</Card>

						<Card className="interactive">
							<CardHeader>
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<DollarSign className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Automated Payouts</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Receive automatic payouts via Stripe Connect. No invoicing, no
									hassle
								</p>
							</CardContent>
						</Card>

						<Card className="interactive">
							<CardHeader>
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<Shield className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Secure & Protected</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Enterprise-grade security with fraud detection and dispute
									protection
								</p>
							</CardContent>
						</Card>

						<Card className="interactive">
							<CardHeader>
								<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
									<TrendingUp className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Flexible Pricing</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Set your own rates for monthly hires or pay-per-click models
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section id="how-it-works" className="py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-4 text-center text-3xl font-bold">
						Three Simple Steps to Start Earning
					</h2>
					<p className="mb-12 text-center text-muted-foreground">
						Total time: 10-15 minutes
					</p>
					<div className="grid gap-8 md:grid-cols-3">
						<Card className="elevated">
							<CardHeader>
								<div className="mb-4 flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
										1
									</div>
									<CheckCircle className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Connect Stripe</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Complete quick KYC verification to receive automated payouts
								</p>
							</CardContent>
						</Card>

						<Card className="elevated">
							<CardHeader>
								<div className="mb-4 flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
										2
									</div>
									<CheckCircle className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Add & Verify Domain</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Verify domain ownership using DNS records or Domain Connect
								</p>
							</CardContent>
						</Card>

						<Card className="elevated">
							<CardHeader>
								<div className="mb-4 flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
										3
									</div>
									<CheckCircle className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Publish Listing</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Set your pricing and go live. Start earning immediately
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Social Proof Section */}
			<section className="py-16">
				<div className="container mx-auto max-w-7xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						Trusted by Domain Owners Worldwide
					</h2>
					<div className="grid gap-6 md:grid-cols-3">
						<Card className="text-center">
							<CardContent className="pt-6">
								<p className="mb-2 text-4xl font-bold text-primary">$2M+</p>
								<p className="text-muted-foreground">Paid to domain owners</p>
							</CardContent>
						</Card>

						<Card className="text-center">
							<CardContent className="pt-6">
								<p className="mb-2 text-4xl font-bold text-primary">5,000+</p>
								<p className="text-muted-foreground">Domains listed</p>
							</CardContent>
						</Card>

						<Card className="text-center">
							<CardContent className="pt-6">
								<p className="mb-2 text-4xl font-bold text-primary">99.9%</p>
								<p className="text-muted-foreground">Uptime guarantee</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section className="py-16">
				<div className="container mx-auto max-w-4xl px-4">
					<h2 className="mb-12 text-center text-3xl font-bold">
						Frequently Asked Questions
					</h2>
					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">
									How much does it cost to list?
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Free to list. We take a small platform fee only when you earn
									revenue from your domain.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">How do I get paid?</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Automatic payouts via Stripe Connect directly to your bank
									account. No manual invoicing required.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">
									Can I remove my listing anytime?
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Yes, you have full control. Active hires will complete their
									term, but you can delist at any time.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="text-lg">
									What if there's a dispute?
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Our dispute resolution team handles all issues fairly and
									professionally to protect both parties.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* Final CTA Section */}
			<section className="py-16 md:py-24">
				<div className="container mx-auto max-w-4xl px-4">
					<Card className="elevated bg-gradient-to-br from-primary/5 to-secondary/5">
						<CardContent className="p-8 text-center md:p-12">
							<h2 className="mb-4 text-3xl font-bold md:text-4xl">
								Ready to Start Earning?
							</h2>
							<p className="mb-8 text-lg text-muted-foreground">
								Join our marketplace and turn your premium domains into passive
								income
							</p>
							<Button
								asChild
								size="lg"
								className="gap-2"
								aria-label="Start onboarding process"
							>
								<Link href="/login?redirect=/onboarding">
									Start Onboarding
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<p className="mt-4 text-sm text-muted-foreground">
								No credit card required. Free to list.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>
		</div>
	);
}
