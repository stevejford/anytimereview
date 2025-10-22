import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, HelpCircle } from "lucide-react";
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function PricingPage() {
	return (
		<main className="container mx-auto max-w-6xl px-4 py-12">
			{/* Hero Section */}
			<div className="mb-12 text-center">
				<h1 className="mb-4 text-4xl font-bold">Simple, Transparent Pricing</h1>
				<p className="text-xl text-muted-foreground">
					No hidden fees. Pay only for what you use.
				</p>
			</div>

			{/* Pricing Cards */}
			<div className="mb-16 grid gap-8 lg:grid-cols-3">
				{/* For Hirers - Monthly */}
				<Card className="flex flex-col">
					<CardHeader>
						<Badge className="mb-2 w-fit" variant="secondary">
							For Hirers
						</Badge>
						<CardTitle className="text-2xl">Monthly Hires</CardTitle>
						<CardDescription>
							Fixed monthly price for exclusive or shared slug access
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1">
						<div className="mb-6">
							<p className="text-3xl font-bold">Varies by listing</p>
							<p className="text-sm text-muted-foreground">
								Set by domain owner
							</p>
						</div>
						<ul className="space-y-3">
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Instant setup & activation</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Cancel anytime before renewal</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Advanced analytics dashboard</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Bot filtering included</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">UTM parameter preservation</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild className="w-full">
							<Link href="/browse">Browse Listings</Link>
						</Button>
					</CardFooter>
				</Card>

				{/* For Hirers - Per-Click */}
				<Card className="flex flex-col border-primary">
					<CardHeader>
						<Badge className="mb-2 w-fit">For Hirers</Badge>
						<CardTitle className="text-2xl">Pay Per Click</CardTitle>
						<CardDescription>
							Usage-based billing for validated clicks
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1">
						<div className="mb-6">
							<p className="text-3xl font-bold">Varies by listing</p>
							<p className="text-sm text-muted-foreground">
								Set by domain owner
							</p>
						</div>
						<ul className="space-y-3">
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">No upfront cost to start</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Billed monthly in arrears</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">IVT credits up to policy caps</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Detailed reporting & exports</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Real-time click validation</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild className="w-full">
							<Link href="/browse">Browse Listings</Link>
						</Button>
					</CardFooter>
				</Card>

				{/* For Owners */}
				<Card className="flex flex-col">
					<CardHeader>
						<Badge className="mb-2 w-fit" variant="outline">
							For Owners
						</Badge>
						<CardTitle className="text-2xl">List Your Domain</CardTitle>
						<CardDescription>
							Earn passive income from your premium domains
						</CardDescription>
					</CardHeader>
					<CardContent className="flex-1">
						<div className="mb-6">
							<p className="text-3xl font-bold">Free to list</p>
							<p className="text-sm text-muted-foreground">
								Only pay when you earn
							</p>
						</div>
						<ul className="space-y-3">
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Stripe Connect automated payouts</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">4% platform fee on earnings</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Set your own pricing</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Dispute protection included</span>
							</li>
							<li className="flex items-start gap-2">
								<Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
								<span className="text-sm">Zero-downtime DNS cutover</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button asChild variant="outline" className="w-full">
							<Link href="/dashboard">Get Started</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>

			<Separator className="mb-16" />

			{/* Fee Structure Section */}
			<section className="mb-16">
				<h2 className="mb-8 text-center text-3xl font-bold">Fee Structure</h2>
				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								Platform Fee
								<HoverCard>
									<HoverCardTrigger>
										<HelpCircle className="h-4 w-4 text-muted-foreground" />
									</HoverCardTrigger>
									<HoverCardContent>
										<p className="text-sm">
											The platform fee covers infrastructure, support, payment
											processing coordination, and dispute resolution services.
										</p>
									</HoverCardContent>
								</HoverCard>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-2 text-2xl font-bold">4%</p>
							<p className="text-sm text-muted-foreground">
								Deducted from owner earnings on all successful transactions.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								Stripe Processing Fees
								<HoverCard>
									<HoverCardTrigger>
										<HelpCircle className="h-4 w-4 text-muted-foreground" />
									</HoverCardTrigger>
									<HoverCardContent>
										<p className="text-sm">
											Standard Stripe fees apply. For Direct Charges, owners pay
											Stripe fees. For usage billing, fees are built into the
											invoice.
										</p>
									</HoverCardContent>
								</HoverCard>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-2 text-2xl font-bold">Varies</p>
							<p className="text-sm text-muted-foreground">
								Depends on payment flow and region. See{" "}
								<a
									href="https://stripe.com/pricing"
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary hover:underline"
								>
									Stripe pricing
								</a>
								.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								IVT Credit Policy
								<HoverCard>
									<HoverCardTrigger>
										<HelpCircle className="h-4 w-4 text-muted-foreground" />
									</HoverCardTrigger>
									<HoverCardContent>
										<p className="text-sm">
											We filter bots and invalid traffic. Credits for validated
											IVT are applied to future invoices, up to policy caps.
										</p>
									</HoverCardContent>
								</HoverCard>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-2 text-2xl font-bold">Up to 2% or $500</p>
							<p className="text-sm text-muted-foreground">
								Per invoice, whichever is greater. See our dispute policy for
								details.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								Refund Policy
								<HoverCard>
									<HoverCardTrigger>
										<HelpCircle className="h-4 w-4 text-muted-foreground" />
									</HoverCardTrigger>
									<HoverCardContent>
										<p className="text-sm">
											Refunds are limited. Pro-rata credits may apply for
											platform-caused downtime per SLA terms.
										</p>
									</HoverCardContent>
								</HoverCard>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-2 text-2xl font-bold">Limited</p>
							<p className="text-sm text-muted-foreground">
								See{" "}
								<Link href="/legal/terms" className="text-primary hover:underline">
									Terms of Service
								</Link>{" "}
								for full policy.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			<Separator className="mb-16" />

			{/* FAQ Section */}
			<section>
				<h2 className="mb-8 text-center text-3xl font-bold">
					Frequently Asked Questions
				</h2>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								What's the difference between period and per-click billing?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Period billing is a fixed monthly price for exclusive or shared
								slug access. Per-click billing is metered usage where you're
								billed monthly for validated clicks only. Choose period for
								predictable costs or per-click for usage-based pricing.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								How do IVT credits work?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								We automatically filter bots and invalid traffic. If additional
								IVT is identified after billing, credits apply up to 2% or $500
								per invoice (whichever is greater) and are reflected on your
								next invoice. You can dispute click quality from your analytics
								dashboard.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								When are payouts sent to owners?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Payouts follow your Stripe Connect payout schedule after
								successful charges clear. Typically this is 2-7 business days
								after the charge. You can view payout status in your dashboard
								under Billing → Payouts.
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Yes! For period hires, cancel before your renewal date in
								Billing → Hires. For per-click plans, cancel the plan to stop
								future usage charges. You'll be billed for usage up to the
								cancellation date.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>
		</main>
	);
}


