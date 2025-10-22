'use client';

import { useState } from 'react';

import { DomainWizard } from '@/components/domains/domain-wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import EmptyState from '@/components/empty-state';
import { Globe } from 'lucide-react';

export default function DomainsPage() {
	const [isWizardOpen, setIsWizardOpen] = useState(false);

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<Breadcrumbs />

			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="mb-2 text-3xl font-bold">My Domains</h1>
					<p className="text-muted-foreground">
						Add and verify domains to enable routing for marketplace listings.
					</p>
				</div>
				<Button onClick={() => setIsWizardOpen(true)}>Add Domain</Button>
			</div>

			<EmptyState
				icon={<Globe />}
				title="No domains yet"
				description="Add your first domain to start listing it for hire and earning passive income from your premium domains."
				action={{
					label: 'Add Domain',
					onClick: () => setIsWizardOpen(true),
				}}
			/>

			<DomainWizard isOpen={isWizardOpen} onOpenChange={setIsWizardOpen} />
		</div>
	);
}



