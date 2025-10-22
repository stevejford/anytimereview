"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInvoices, getPayouts, getConnectStatus } from "@/lib/api-client";
import InvoiceList from "@/components/billing/invoice-list";
import PayoutList from "@/components/billing/payout-list";
import ConnectOnboardingDialog from "@/components/billing/connect-onboarding-dialog";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import EmptyState from "@/components/empty-state";
import { Receipt, Wallet } from "lucide-react";

export default function BillingPage() {
	const searchParams = useSearchParams();
	const [onboardingOpen, setOnboardingOpen] = useState(false);
	const [showSuccessAlert, setShowSuccessAlert] = useState(false);

	const { data: invoices, isLoading: invoicesLoading } = useQuery({
		queryKey: ["invoices"],
		queryFn: () => getInvoices(),
	});

	const { data: payouts, isLoading: payoutsLoading } = useQuery({
		queryKey: ["payouts"],
		queryFn: () => getPayouts(),
	});

	const { data: connectStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
		queryKey: ["connectStatus"],
		queryFn: () => getConnectStatus(),
	});

	useEffect(() => {
		// Handle success redirect from payment or connect
		const payment = searchParams.get("payment");
		const connect = searchParams.get("connect");

		if (payment === "success" || connect === "success") {
			setShowSuccessAlert(true);
			refetchStatus();
			setTimeout(() => setShowSuccessAlert(false), 5000);
		}
	}, [searchParams, refetchStatus]);

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<div className="space-y-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Billing</h1>
						<p className="text-gray-500">
							Manage your invoices, payouts, and payment settings.
						</p>
					</div>

					{!statusLoading && !connectStatus?.onboardingComplete && (
						<Button onClick={() => setOnboardingOpen(true)}>
							Setup Stripe Connect
						</Button>
					)}
				</div>

				{showSuccessAlert && (
					<Alert>
						<AlertDescription className="text-green-600">
							✓ Success! Your payment or onboarding was completed.
						</AlertDescription>
					</Alert>
				)}

				{!statusLoading && !connectStatus?.onboardingComplete && (
					<Alert>
						<AlertDescription>
							You need to complete Stripe Connect onboarding to receive payments for your listings.
							<Button
								variant="link"
								className="ml-2 p-0 h-auto"
								onClick={() => setOnboardingOpen(true)}
							>
								Start onboarding
							</Button>
						</AlertDescription>
					</Alert>
				)}

				{connectStatus?.onboardingComplete && (
					<Card>
						<CardHeader>
							<CardTitle>Stripe Connect Status</CardTitle>
							<CardDescription>Your account is ready to receive payments</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex items-center space-x-2">
								<span className="text-green-600">✓</span>
								<span>Account ID: {connectStatus.accountId}</span>
							</div>
							<div className="flex items-center space-x-2 mt-2">
								<span className="text-green-600">✓</span>
								<span>Charges Enabled: {connectStatus.chargesEnabled ? "Yes" : "No"}</span>
							</div>
							<div className="flex items-center space-x-2 mt-2">
								<span className="text-green-600">✓</span>
								<span>Payouts Enabled: {connectStatus.payoutsEnabled ? "Yes" : "No"}</span>
							</div>
						</CardContent>
					</Card>
				)}

				<Tabs defaultValue="invoices" className="space-y-4">
					<TabsList>
						<TabsTrigger value="invoices">Invoices</TabsTrigger>
						<TabsTrigger value="payouts">Payouts</TabsTrigger>
					</TabsList>

					<TabsContent value="invoices">
						<Card>
							<CardHeader>
								<CardTitle>Invoices</CardTitle>
								<CardDescription>
									View your hire invoices and payment history
								</CardDescription>
							</CardHeader>
							<CardContent>
								{invoicesLoading ? (
									<div className="text-center py-8">Loading invoices...</div>
								) : (
									<InvoiceList invoices={invoices ?? []} />
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="payouts">
						<Card>
							<CardHeader>
								<CardTitle>Payouts</CardTitle>
								<CardDescription>
									Track payouts for your listings
								</CardDescription>
							</CardHeader>
							<CardContent>
								{payoutsLoading ? (
									<div className="text-center py-8">Loading payouts...</div>
								) : (
									<PayoutList payouts={payouts ?? []} />
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				<ConnectOnboardingDialog
					open={onboardingOpen}
					onOpenChange={setOnboardingOpen}
					onSuccess={() => {
						setOnboardingOpen(false);
						refetchStatus();
					}}
				/>
			</div>
		</div>
	);
}

