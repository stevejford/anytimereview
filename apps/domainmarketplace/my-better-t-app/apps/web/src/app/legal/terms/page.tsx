import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function TermsPage() {
	return (
		<main className="container mx-auto max-w-4xl px-4 py-12">
			<article className="prose prose-slate max-w-none dark:prose-invert">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-2 text-4xl font-bold">Terms of Service</h1>
					<p className="text-muted-foreground">Last updated: October 18, 2025</p>
				</div>

				<Separator className="mb-8" />

				{/* Content */}
				<Card className="mb-8">
					<CardContent className="space-y-6 pt-6">
						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								1. Acceptance and Definitions
							</h2>
							<p className="text-muted-foreground">
								By using the platform (the "Service"), you agree to these Terms.
								"Owner" lists a domain for hire. "Hirer" hires a domain or
								path slugs. "User Content" includes routing targets, landing
								pages, listings, and any materials you submit. We provide a
								marketplace and routing infrastructure. We are not a registrar
								and do not sell domains unless explicitly stated.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								2. Service Description; Marketplace Role
							</h2>
							<p className="text-muted-foreground">
								The Service enables Owners to list domains and Hirers to hire
								them for campaigns (exclusive or via slugs). We provide DNS
								onboarding guidance, edge routing (HTTP redirects), analytics,
								and payments tooling. We do not host Hirer landing pages.
								Hirers are responsible for their content and destinations. We
								may provide temporary or permanent redirect options; SEO
								outcomes are not guaranteed.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								3. Accounts and Eligibility
							</h2>
							<p className="text-muted-foreground">
								You must be at least the age of majority in your jurisdiction
								and able to form a binding contract. You agree to provide
								accurate information and maintain the security of your account.
								We may require KYC through our payment processor.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								4. Listings and Hires
							</h2>
							<p className="text-muted-foreground">
								Owners represent they control the domain and may configure DNS
								for routing. Owners agree to cooperate with verification
								(TXT/HTTP/Domain Connect) and safe cutover. Hirers set routing
								targets and redirect type (e.g., 302). Hirers warrant they
								have rights to all content and destinations and will comply with
								the AUP. We may suspend or modify routing to address abuse,
								legal claims (e.g., DMCA/UDRP), security, or platform integrity.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								5. Fees, Payments, and Taxes
							</h2>
							<p className="text-muted-foreground">
								We use Stripe Connect for payouts to Owners. We charge a
								platform fee (currently 4% of gross), and Stripe processing fees
								apply per flow. Period hires are typically processed as Direct
								Charges to Owner's connected account with an application fee to
								the platform. Per-click hires are billed as metered usage to
								the Hirer; Owner payouts are transfers of the gross less
								platform fee and any adjustments. You authorize us and our
								processors to charge your payment method. We may place
								reserves/holds to manage risk. Taxes are your responsibility.
								Where required, we will collect and remit taxes, or request tax
								information from you.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								6. Refunds, Credits, and Disputes
							</h2>
							<p className="text-muted-foreground">
								Refunds for period hires are limited. Pro-rata credits may be
								offered for platform-caused downtime per published SLAs. For
								metered billing, we credit validated invalid traffic (IVT) per
								policy. Disputes must be submitted within the stated window.
								Chargebacks: you must provide accurate information. We may
								deduct dispute losses from payouts.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								7. Acceptable Use; Prohibited Conduct
							</h2>
							<p className="text-muted-foreground">
								You must follow our{" "}
								<Link href="/legal/aup" className="text-primary hover:underline">
									Acceptable Use Policy (AUP)
								</Link>
								. Prohibited uses include illegal content, IP infringement,
								malware, phishing, spam, deceptive or harmful redirects, and
								other high-risk categories listed in the AUP. Traffic
								manipulation (e.g., click fraud, bots) is prohibited. We apply
								bot/IVT filters and may adjust usage.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								8. Intellectual Property; DMCA
							</h2>
							<p className="text-muted-foreground">
								You retain rights in your User Content. You grant us a
								non-exclusive license to use, host, cache, display, and transmit
								your User Content as necessary to operate the Service. We follow
								a notice-and-takedown process under the DMCA. See our DMCA
								Policy for how to submit notices and counter-notices.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								9. Third-Party Services and Processors
							</h2>
							<p className="text-muted-foreground">
								The Service integrates with third parties (e.g., Cloudflare,
								Stripe, Neon, Resend). Their terms and privacy practices apply
								to your use of those services.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">10. Privacy</h2>
							<p className="text-muted-foreground">
								Our{" "}
								<Link
									href="/legal/privacy"
									className="text-primary hover:underline"
								>
									Privacy Policy
								</Link>{" "}
								explains what data we collect and how we use it, including click
								analytics and payment information. By using the Service, you
								consent to our processing as described there.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">11. Disclaimers</h2>
							<p className="text-muted-foreground">
								The Service is provided "AS IS" and "AS AVAILABLE." We disclaim
								warranties of merchantability, fitness for a particular purpose,
								and non-infringement. We do not guarantee any SEO outcomes,
								rankings, or traffic performance.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								12. Limitation of Liability
							</h2>
							<p className="text-muted-foreground">
								To the maximum extent permitted by law, neither we nor our
								suppliers are liable for indirect, incidental, special,
								consequential, or exemplary damages. Our total liability for
								claims arising from or relating to the Service will not exceed
								the greater of (a) amounts you paid to us in the three months
								preceding the claim or (b) USD $100.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								13. Indemnification
							</h2>
							<p className="text-muted-foreground">
								You will indemnify and hold us harmless from claims arising out
								of your User Content, your use of the Service, your violation of
								these Terms, or your violation of laws/rights of others.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								14. Suspension and Termination
							</h2>
							<p className="text-muted-foreground">
								We may suspend or terminate access for violations of these
								Terms, AUP, non-payment, fraud, legal requests, or risk to the
								Service. We will make reasonable efforts to notify you when
								appropriate.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								15. Disputes; Governing Law
							</h2>
							<p className="text-muted-foreground">
								These Terms are governed by applicable law, without regard to
								conflict-of-law rules. Any dispute will be resolved in the
								appropriate venue. You waive class actions to the extent
								permitted by law.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								16. Changes to Terms
							</h2>
							<p className="text-muted-foreground">
								We may update these Terms. We will post the new Terms and update
								the "Last updated" date. Continued use constitutes acceptance.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">17. Contact</h2>
							<p className="text-muted-foreground">
								Legal inquiries:{" "}
								<a
									href="mailto:legal@hireadomain.com"
									className="text-primary hover:underline"
								>
									legal@hireadomain.com
								</a>
							</p>
						</section>
					</CardContent>
				</Card>

				{/* Related Links */}
				<Card>
					<CardHeader>
						<CardTitle>Related Policies</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							<li>
								<Link
									href="/legal/privacy"
									className="text-primary hover:underline"
								>
									Privacy Policy
								</Link>
							</li>
							<li>
								<Link href="/legal/aup" className="text-primary hover:underline">
									Acceptable Use Policy
								</Link>
							</li>
							<li>
								<Link
									href="/legal/dmca"
									className="text-primary hover:underline"
								>
									DMCA Policy
								</Link>
							</li>
						</ul>
					</CardContent>
				</Card>
			</article>
		</main>
	);
}


