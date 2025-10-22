import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export const metadata: Metadata = {
	title: "Status",
	robots: "noindex",
};

export default function StatusPage() {
	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div>
					<h1 className="mb-2 text-3xl font-bold">System Status</h1>
					<p className="text-muted-foreground">
						Current status of our services and infrastructure.
					</p>
				</div>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<div>
							<CardTitle>All Systems Operational</CardTitle>
							<CardDescription>
								All services are running normally.
							</CardDescription>
						</div>
						<Badge className="bg-green-500">Operational</Badge>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm">API</span>
								<Badge variant="outline" className="bg-green-50 text-green-700">Up</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Web Application</span>
								<Badge variant="outline" className="bg-green-50 text-green-700">Up</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm">Domain Routing</span>
								<Badge variant="outline" className="bg-green-50 text-green-700">Up</Badge>
							</div>
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


