"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

// Map path segments to readable labels
const labelMap: Record<string, string> = {
	dashboard: "Dashboard",
	domains: "Domains",
	listings: "Listings",
	hires: "Hires",
	billing: "Billing",
	browse: "Browse",
	admin: "Admin",
	disputes: "Disputes",
	users: "Users",
	routes: "Routes",
	analytics: "Analytics",
	about: "About",
	pricing: "Pricing",
	legal: "Legal",
	terms: "Terms of Service",
	privacy: "Privacy Policy",
	aup: "Acceptable Use Policy",
	hire: "Hire",
};

export default function Breadcrumbs() {
	const pathname = usePathname();
	
	// Don't show breadcrumbs on home page
	if (pathname === "/") {
		return null;
	}

	// Split pathname into segments
	const segments = pathname.split("/").filter(Boolean);
	
	// Build breadcrumb items
	const breadcrumbs = segments.map((segment, index) => {
		const path = `/${segments.slice(0, index + 1).join("/")}`;
		// Check if segment is a dynamic ID (UUID pattern or other ID-like patterns)
		const isUUID = segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		const isNonSemanticId = segment.match(/^[a-z0-9]{6,}$/i) && !labelMap[segment];
		// Check if parent folder is a known id param location
		const parentSegment = index > 0 ? segments[index - 1] : null;
		const isIdParam = parentSegment && (parentSegment === 'hires' || parentSegment === 'browse' || parentSegment === 'disputes');
		
		const isId = isUUID || (isNonSemanticId && isIdParam);
		const label = isId ? "Details" : labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
		
		return {
			label,
			path,
			isLast: index === segments.length - 1,
		};
	});

	// Add home as first item
	breadcrumbs.unshift({
		label: "Home",
		path: "/",
		isLast: false,
	});

	return (
		<nav aria-label="Breadcrumb" className="mb-4">
			<ol role="list" className="flex items-center space-x-2 text-sm">
				{breadcrumbs.map((breadcrumb, index) => (
					<Fragment key={breadcrumb.path}>
						<li className="flex items-center">
							{breadcrumb.isLast ? (
								<span className="font-medium text-foreground" aria-current="page">
									{breadcrumb.label}
								</span>
							) : (
								<Link
									href={breadcrumb.path}
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									{breadcrumb.label}
								</Link>
							)}
						</li>
						{!breadcrumb.isLast && (
							<li aria-hidden="true">
								<ChevronRight className="h-4 w-4 text-muted-foreground" />
							</li>
						)}
					</Fragment>
				))}
			</ol>
		</nav>
	);
}

