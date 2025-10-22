import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Privacy Policy - HireADomain",
	description: "Privacy Policy for HireADomain. Learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
	return (
		<main className="container mx-auto max-w-4xl px-4 py-12">
			<article className="prose prose-slate max-w-none dark:prose-invert">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
					<p className="text-muted-foreground">Last updated: October 18, 2025</p>
				</div>

				<Separator className="mb-8" />

				{/* Content */}
				<Card className="mb-8">
					<CardContent className="space-y-6 pt-6">
						<section>
							<h2 className="mb-3 text-2xl font-semibold">1. Who We Are</h2>
							<p className="text-muted-foreground">
								This policy explains how we collect, use, and share information
								when you use our marketplace and routing services. Contact us at{" "}
								<a
									href="mailto:privacy@hireadomain.com"
									className="text-primary hover:underline"
								>
									privacy@hireadomain.com
								</a>
								.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">2. Data We Collect</h2>
							<ul className="space-y-2 text-muted-foreground">
								<li>
									<strong className="text-foreground">Account data:</strong>{" "}
									name, email, authentication information
								</li>
								<li>
									<strong className="text-foreground">Payments/payouts:</strong>{" "}
									limited billing information via our processor (Stripe). We do
									not store full card numbers.
								</li>
								<li>
									<strong className="text-foreground">Service data:</strong>{" "}
									domains, routes, settings, logs
								</li>
								<li>
									<strong className="text-foreground">Click telemetry:</strong>{" "}
									timestamp, host, path, hirer/owner IDs, country, ASN, user
									agent hash, referrer domain, bot score bucket, and counts. We
									hash or minimize IP addresses for deduplication.
								</li>
								<li>
									<strong className="text-foreground">Support:</strong>{" "}
									communications and files you provide
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">3. How We Use Data</h2>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									Provide and operate the Service (routing, analytics, billing,
									payouts)
								</li>
								<li>Prevent abuse and fraud; measure and improve performance</li>
								<li>Communicate with you (service notices, support)</li>
								<li>Comply with legal obligations</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								4. Legal Bases (EEA/UK)
							</h2>
							<p className="text-muted-foreground">
								We process your data based on:
							</p>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>Contract (to provide the Service)</li>
								<li>
									Legitimate interests (security, fraud prevention, product
									improvement)
								</li>
								<li>Legal obligation (tax, accounting)</li>
								<li>Consent where required (cookies/marketing)</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								5. Sharing and Processors
							</h2>
							<p className="text-muted-foreground">
								We share data with service providers acting on our behalf,
								including:
							</p>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									Cloudflare (edge routing, analytics), Stripe (payments/payouts),
									Neon (database), Resend (email), and similar vendors as needed
								</li>
								<li>
									We may disclose information to comply with law, enforce
									policies, protect rights/safety, or as part of a business
									transaction
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								6. International Transfers
							</h2>
							<p className="text-muted-foreground">
								We may transfer data to countries with different data protection
								laws. Where required, we use appropriate safeguards (e.g.,
								Standard Contractual Clauses).
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">7. Retention</h2>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									We retain account and billing records as required by law
								</li>
								<li>
									Click telemetry: raw events retained for up to 13 months;
									aggregated analytics may be stored longer
								</li>
								<li>
									You may request deletion subject to legal obligations and our
									DSR process
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">8. Security</h2>
							<p className="text-muted-foreground">
								We use technical and organizational measures, including
								encryption in transit, access controls, and audit logs. No method
								is 100% secure.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">9. Your Rights</h2>
							<p className="text-muted-foreground">
								Depending on your location, you may have rights to access,
								correct, delete, port, or object to processing of your personal
								data. To exercise rights, contact{" "}
								<a
									href="mailto:privacy@hireadomain.com"
									className="text-primary hover:underline"
								>
									privacy@hireadomain.com
								</a>
								. We will verify your identity and respond within required
								timelines.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								10. Cookies and Similar Technologies
							</h2>
							<p className="text-muted-foreground">
								We use necessary cookies for authentication and security, and
								optional analytics cookies where permitted. You can manage
								preferences in your browser or via our cookie banner.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">11. Children</h2>
							<p className="text-muted-foreground">
								The Service is not directed to children under 16. Do not use the
								Service if you are under the applicable age threshold.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">12. Changes</h2>
							<p className="text-muted-foreground">
								We may update this policy. We will post changes with an updated
								"Last updated" date.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">13. Contact</h2>
							<p className="text-muted-foreground">
								Email:{" "}
								<a
									href="mailto:privacy@hireadomain.com"
									className="text-primary hover:underline"
								>
									privacy@hireadomain.com
								</a>
							</p>
						</section>
					</CardContent>
				</Card>

				{/* Related Links */}
				<Card>
					<CardHeader>
						<CardTitle>Related Documents</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							<li>
								<Link
									href="/legal/terms"
									className="text-primary hover:underline"
								>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link href="/legal/aup" className="text-primary hover:underline">
									Acceptable Use Policy
								</Link>
							</li>
						</ul>
					</CardContent>
				</Card>
			</article>
		</main>
	);
}


