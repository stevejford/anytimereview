import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "DMCA Policy - HireADomain",
	description: "DMCA Policy for HireADomain. Digital Millennium Copyright Act policy and procedures for reporting copyright infringement.",
};

export default function DMCAPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">DMCA Policy</h1>
					<p className="text-muted-foreground">
						Last updated: {new Date().toLocaleDateString()}
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Copyright Infringement Notification</CardTitle>
					</CardHeader>
					<CardContent className="prose prose-sm max-w-none">
						<p>
							HireADomain respects the intellectual property rights of others and expects our users to do the same.
							In accordance with the Digital Millennium Copyright Act (DMCA), we will respond to valid notices of
							alleged copyright infringement.
						</p>

						<h3 className="mt-6 text-lg font-semibold">Filing a DMCA Notice</h3>
						<p>
							If you believe that your copyrighted work has been copied in a way that constitutes copyright
							infringement and is accessible via our service, please notify our copyright agent with the
							following information:
						</p>
						<ul className="list-disc pl-6">
							<li>Identification of the copyrighted work claimed to have been infringed</li>
							<li>Identification of the material that is claimed to be infringing</li>
							<li>Your contact information (address, telephone number, email address)</li>
							<li>A statement of good faith belief that the use is not authorized</li>
							<li>A statement that the information in the notification is accurate</li>
							<li>Physical or electronic signature of the copyright owner or authorized agent</li>
						</ul>

						<h3 className="mt-6 text-lg font-semibold">Contact</h3>
						<p>
							Send DMCA notices to: <strong>dmca@hireadomain.com</strong>
						</p>

						<p className="mt-4 text-sm text-muted-foreground">
							Please note that under Section 512(f) of the DMCA, any person who knowingly materially
							misrepresents that material is infringing may be subject to liability.
						</p>
					</CardContent>
				</Card>

				<div className="flex gap-4">
					<Button asChild variant="outline">
						<Link href="/legal/terms">Terms of Service</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/legal/privacy">Privacy Policy</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}


