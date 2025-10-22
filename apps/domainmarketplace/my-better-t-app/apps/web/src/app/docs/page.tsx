import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "Documentation",
	robots: "noindex",
};

export default function DocsPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Documentation</h1>
					<p className="text-muted-foreground">
						API documentation and integration guides.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							Comprehensive API documentation and developer guides are on the way.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							We're preparing detailed documentation for our REST API, webhooks, and SDK integrations.
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


