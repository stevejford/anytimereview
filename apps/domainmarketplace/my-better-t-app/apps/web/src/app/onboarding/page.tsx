"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMode } from "@/lib/hooks/use-mode";
import { OwnerOnboardingWizard } from "@/components/wizard/owner-onboarding-wizard";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
	const { user, isLoaded, isSignedIn } = useUser();
	const { hasCompletedOnboarding } = useMode();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded) {
			if (!isSignedIn) {
				router.push("/login?redirect=/onboarding");
			} else if (hasCompletedOnboarding) {
				router.push("/host/dashboard");
			}
		}
	}, [isLoaded, isSignedIn, hasCompletedOnboarding, router]);

	// Show loading state while checking auth
	if (!isLoaded) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background">
				<div className="text-center">
					<Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render wizard if redirecting
	if (!isSignedIn || hasCompletedOnboarding) {
		return null;
	}

	const handleComplete = () => {
		toast.success("🎉 Welcome to host mode!");
		router.push("/host/dashboard");
	};

	return (
		<div className="min-h-screen bg-background py-8">
			<div className="container mx-auto max-w-4xl px-4">
				<OwnerOnboardingWizard onComplete={handleComplete} />
			</div>
		</div>
	);
}

