import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Target, Shield, Zap, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
	title: "About - HireADomain",
	description: "Learn about HireADomain, the secure marketplace connecting domain owners with marketers for flexible domain hires.",
};

export default function AboutPage() {
	return (
		<main className="container mx-auto max-w-4xl px-4 py-12">
			{/* Hero Section */}
			<div className="mb-12 text-center">
				<h1 className="mb-4 text-4xl font-bold">About HireADomain</h1>
				<p className="text-xl text-muted-foreground">
					We connect domain owners with marketers through a secure, transparent
					marketplace for domain hires.
				</p>
			</div>

			<Separator className="mb-12" />

			{/* Company Story */}
			<section className="mb-16">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">Our Story</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-muted-foreground">
						<div>
							<h3 className="mb-2 font-semibold text-foreground">
								The Problem
							</h3>
							<p>
								Thousands of premium domains sit parked, generating minimal
								revenue while marketers struggle to find quality domains for
								their campaigns. Traditional domain parking wastes valuable
								digital real estate, and purchasing premium domains outright is
								prohibitively expensive for most campaigns.
							</p>
						</div>
						<div>
							<h3 className="mb-2 font-semibold text-foreground">
								Our Solution
							</h3>
							<p>
								HireADomain creates a flexible hire marketplace where domain
								owners can earn passive income and marketers can access
								high-authority domains for their campaigns. With instant setup,
								transparent pricing, and advanced analytics, we make domain
								hires simple and secure for everyone.
							</p>
						</div>
						<div>
							<h3 className="mb-2 font-semibold text-foreground">Our Vision</h3>
							<p>
								We're democratizing access to premium domains. Whether you're a
								Fortune 500 company or a startup testing a new market, you
								should have access to quality domains that enhance your brand
								and drive results. We're building the infrastructure to make
								that possible.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			{/* Values Section */}
			<section className="mb-16">
				<h2 className="mb-8 text-center text-3xl font-bold">Our Values</h2>
				<div className="grid gap-6 md:grid-cols-2">
					{/* Value 1 */}
					<Card>
						<CardHeader>
							<Target className="mb-2 h-8 w-8 text-primary" />
							<CardTitle>Transparency</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Clear pricing, no hidden fees, and detailed analytics. You
								always know exactly what you're paying for and what you're
								getting.
							</p>
						</CardContent>
					</Card>

					{/* Value 2 */}
					<Card>
						<CardHeader>
							<Shield className="mb-2 h-8 w-8 text-primary" />
							<CardTitle>Security</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Stripe Connect for secure payments, advanced bot filtering to
								protect against fraud, and comprehensive dispute resolution to
								protect all parties.
							</p>
						</CardContent>
					</Card>

					{/* Value 3 */}
					<Card>
						<CardHeader>
							<Zap className="mb-2 h-8 w-8 text-primary" />
							<CardTitle>Flexibility</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Monthly or per-click pricing, exclusive or shared slug modes,
								cancel anytime. We adapt to your needs, not the other way
								around.
							</p>
						</CardContent>
					</Card>

					{/* Value 4 */}
					<Card>
						<CardHeader>
							<HeartHandshake className="mb-2 h-8 w-8 text-primary" />
							<CardTitle>Support</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Responsive customer support, comprehensive documentation, and
								dedicated onboarding assistance. We're here to help you
								succeed.
							</p>
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Team Section (Placeholder) */}
			<section className="mb-16">
				<h2 className="mb-8 text-center text-3xl font-bold">Our Team</h2>
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<p>
							We're a distributed team of engineers, marketers, and domain
							experts passionate about making domain rentals accessible to
							everyone.
						</p>
					</CardContent>
				</Card>
			</section>

			{/* Contact Section */}
			<section>
				<h2 className="mb-8 text-center text-3xl font-bold">Get in Touch</h2>
				<Card>
					<CardContent className="space-y-4 py-6 text-center">
						<p className="text-muted-foreground">
							Have questions or want to learn more? We'd love to hear from you.
						</p>
						<div className="space-y-2">
							<p>
								<strong>Support:</strong>{" "}
								<a
									href="mailto:support@hireadomain.com"
									className="text-primary hover:underline"
								>
									support@hireadomain.com
								</a>
							</p>
							<p>
								<strong>Documentation:</strong>{" "}
								<a href="/docs" className="text-primary hover:underline">
									View our comprehensive docs
								</a>
							</p>
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}


