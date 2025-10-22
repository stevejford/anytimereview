import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "Blog - HireADomain",
	description: "News, updates, and insights from the HireADomain team.",
	robots: "noindex",
};

export default function BlogPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Blog</h1>
					<p className="text-muted-foreground">
						News, updates, and insights from the HireADomain team.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							We're preparing content about domain hires, marketing tips, and platform updates.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Subscribe to our newsletter to be notified when we publish new posts.
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


