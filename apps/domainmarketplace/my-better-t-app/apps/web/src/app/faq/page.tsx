import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "FAQ",
	robots: "noindex",
};

export default function FAQPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Frequently Asked Questions</h1>
					<p className="text-muted-foreground">
						Get answers to common questions about our platform.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Coming Soon</CardTitle>
						<CardDescription>
							We're compiling the most frequently asked questions and answers.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Have a question? Contact our support team at support@hireadomain.com
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


