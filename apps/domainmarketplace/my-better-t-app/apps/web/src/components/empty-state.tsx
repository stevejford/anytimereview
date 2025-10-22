import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	action?: {
		label: string;
		onClick?: () => void;
		href?: string;
	};
}

export default function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<Card>
			<CardContent className="flex flex-col items-center justify-center py-12 text-center">
				<div className="mb-4 text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">
					{icon}
				</div>
				<h3 className="mb-2 text-lg font-semibold">{title}</h3>
				<p className="mb-6 max-w-sm text-sm text-muted-foreground">
					{description}
				</p>
				{action && (
					<>
						{action.href ? (
							<Button asChild>
								<Link href={action.href}>{action.label}</Link>
							</Button>
						) : (
							<Button onClick={action.onClick}>{action.label}</Button>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}


