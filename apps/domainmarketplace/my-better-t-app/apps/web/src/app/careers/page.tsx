import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "Careers",
	robots: "noindex",
};

export default function CareersPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">Careers</h1>
					<p className="text-muted-foreground">
						Join our team and help build the future of domain hires.
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>No Open Positions</CardTitle>
						<CardDescription>
							We're not currently hiring, but we're always interested in talking to talented people.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							Send your resume and cover letter to careers@hireadomain.com
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


