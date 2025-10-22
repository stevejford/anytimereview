import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "API",
	robots: "noindex",
};

export default function APIPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">API</h1>
					<p className="text-muted-foreground">
						Programmatic access to our domain hire platform.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							Our REST API is currently in development for enterprise customers.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Interested in API access? Contact us at api@hireadomain.com to join the waitlist.
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


