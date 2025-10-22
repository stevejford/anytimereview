import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "Support",
	robots: "noindex",
};

export default function SupportPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Support</h1>
					<p className="text-muted-foreground">
						Get help with your account and domain hires.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Contact Support</CardTitle>
						<CardDescription>
							Our support center is being set up. In the meantime, reach out directly.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<p className="text-sm font-medium">Email Support</p>
							<p className="text-sm text-muted-foreground">support@hireadomain.com</p>
						</div>
						<div>
							<p className="text-sm font-medium">Business Hours</p>
							<p className="text-sm text-muted-foreground">Monday - Friday, 9am - 5pm EST</p>
						</div>
					</CardContent>
				</Card>

				<Button asChild>
					<Link href="/">Return Home</Link>
				</Button>
			</div>
		</div>
	);
}


