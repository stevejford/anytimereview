import { OwnerOnboardingWizard } from "@/components/wizard/owner-onboarding-wizard";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export default function OnboardingPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<OwnerOnboardingWizard />
		</div>
	);
}


