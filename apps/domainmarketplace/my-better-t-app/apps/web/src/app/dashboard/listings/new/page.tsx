import { ListingCreationWizard } from "@/components/wizard/listing-creation-wizard";
import Breadcrumbs from "@/components/navigation/breadcrumbs";

export default function NewListingPage() {
	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Breadcrumbs />
			<ListingCreationWizard />
		</div>
	);
}


