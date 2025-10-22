import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Acceptable Use Policy - HireADomain",
	description: "Acceptable Use Policy for HireADomain. Guidelines for responsible use of our platform.",
};

export default function AUPPage() {
	return (
		<main className="container mx-auto max-w-4xl px-4 py-12">
			<article className="prose prose-slate max-w-none dark:prose-invert">
				{/* Header */}
				<div className="mb-8">
					<h1 className="mb-2 text-4xl font-bold">Acceptable Use Policy</h1>
					<p className="text-muted-foreground">
						Guidelines for using our platform responsibly
					</p>
				</div>

				<Separator className="mb-8" />

				{/* Warning Alert */}
				<Alert variant="destructive" className="mb-8">
					<AlertTriangle className="h-4 w-4" />
					<AlertTitle>Important Notice</AlertTitle>
					<AlertDescription>
						Violations of this policy may result in immediate suspension or
						termination of your account. Severe violations may be reported to
						law enforcement.
					</AlertDescription>
				</Alert>

				{/* Content */}
				<Card className="mb-8">
					<CardContent className="space-y-6 pt-6">
						<section>
							<h2 className="mb-3 text-2xl font-semibold">Purpose</h2>
							<p className="text-muted-foreground">
								This Acceptable Use Policy (AUP) protects users and third
								parties by restricting abusive or unlawful use of the Service.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">Applies To</h2>
							<p className="text-muted-foreground">
								All Owners and Hirers; all routed destinations and content; all
								traffic directed via the Service.
							</p>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								Prohibited Content and Uses
							</h2>
							<p className="mb-4 text-muted-foreground">
								The following activities are strictly prohibited
								(non-exhaustive list):
							</p>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									<strong className="text-foreground">Illegal activities:</strong>{" "}
									Any content or activity that violates applicable laws or
									regulations
								</li>
								<li>
									<strong className="text-foreground">
										Intellectual property infringement:
									</strong>{" "}
									Counterfeits, unauthorized use of trademarks or copyrighted
									works
								</li>
								<li>
									<strong className="text-foreground">
										Child exploitation:
									</strong>{" "}
									Child sexual abuse material, sexual content involving minors,
									sexual exploitation
								</li>
								<li>
									<strong className="text-foreground">
										Harassment and hate:
									</strong>{" "}
									Harassment, hate, or discrimination targeting protected
									classes; incitement to violence or extremist propaganda
								</li>
								<li>
									<strong className="text-foreground">Malware and phishing:</strong>{" "}
									Malware, exploits, malicious scripts, phishing, credential
									harvesting, deceptive practices
								</li>
								<li>
									<strong className="text-foreground">Fraud and scams:</strong>{" "}
									Fraud, scams, pyramid schemes, or misrepresentation
								</li>
								<li>
									<strong className="text-foreground">Weapons and harm:</strong>{" "}
									Weapons, explosives, or instructions intended to cause harm in
									violation of law
								</li>
								<li>
									<strong className="text-foreground">Illegal drugs:</strong>{" "}
									Illegal drugs, controlled substances, unsafe supplements,
									unsubstantiated medical claims
								</li>
								<li>
									<strong className="text-foreground">
										Unlawful gambling and money laundering:
									</strong>{" "}
									Unlawful gambling, money laundering, sanctions violations
								</li>
								<li>
									<strong className="text-foreground">Privacy violations:</strong>{" "}
									Doxxing or invasions of privacy
								</li>
								<li>
									<strong className="text-foreground">
										Traffic manipulation:
									</strong>{" "}
									Click fraud, botnets, automated traffic spoofing, cloaking, or
									misdirection
								</li>
								<li>
									<strong className="text-foreground">Spam:</strong> Spam or
									unsolicited bulk messaging; link farms
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								Regulated/High-Risk Categories
							</h2>
							<p className="mb-4 text-muted-foreground">
								The following categories may require additional review or
								documentation:
							</p>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>Financial services, lending, cryptoassets</li>
								<li>Healthcare and pharmaceuticals</li>
								<li>Political advertising</li>
								<li>Alcohol and tobacco</li>
								<li>Adult content (legal but restricted)</li>
								<li>Ticket resale</li>
								<li>Sweepstakes</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								Routing and DNS Abuse
							</h2>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									No abusive DNS configurations or attempts to evade
									verification/safety controls
								</li>
								<li>
									No open redirect patterns intended to facilitate malware/spam
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">Enforcement</h2>
							<ul className="list-disc space-y-2 pl-6 text-muted-foreground">
								<li>
									We may block, suspend, or remove content or routing immediately
									where we believe there is risk, abuse, or legal exposure
								</li>
								<li>
									Repeated or severe violations may result in account termination
								</li>
								<li>
									Appeals: You may submit an appeal with supporting information;
									we will review in good faith but are not obligated to reinstate
								</li>
							</ul>
						</section>

						<Separator />

						<section>
							<h2 className="mb-3 text-2xl font-semibold">
								Reporting Violations
							</h2>
							<p className="text-muted-foreground">
								To report abuse, contact{" "}
								<a
									href="mailto:support@hireadomain.com"
									className="text-primary hover:underline"
								>
									support@hireadomain.com
								</a>{" "}
								or use in-app reporting. Include URLs, evidence, and relevant
								timestamps.
							</p>
						</section>
					</CardContent>
				</Card>

				{/* Contact Card */}
				<Card className="mb-8">
					<CardHeader>
						<CardTitle>Report Abuse</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="mb-4 text-muted-foreground">
							If you encounter content or behavior that violates this policy,
							please report it immediately.
						</p>
						<div className="space-y-2">
							<p>
								<strong>Email:</strong>{" "}
								<a
									href="mailto:support@hireadomain.com"
									className="text-primary hover:underline"
								>
									support@hireadomain.com
								</a>
							</p>
							<p className="text-sm text-muted-foreground">
								Include: URLs, evidence (screenshots), and timestamps
							</p>
						</div>
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
									href="/legal/terms"
									className="text-primary hover:underline"
								>
									Terms of Service
								</Link>
							</li>
							<li>
								<Link
									href="/legal/privacy"
									className="text-primary hover:underline"
								>
									Privacy Policy
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


