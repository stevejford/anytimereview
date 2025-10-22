import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "How It Works",
	robots: "noindex",
};

export default function HowItWorksPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">How It Works</h1>
					<p className="text-muted-foreground">
						Learn how our domain hire marketplace connects owners and hirers.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							We're working on comprehensive documentation to help you understand our platform.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Check back soon for detailed guides on how to hire domains, configure routes, and maximize your campaigns.
						</p>
					</CardContent>
				</Card>

				<Button asChild>
					<Link href="/">Return Home</Link>
				</Button>
			</div>
		</div>
	);
}


