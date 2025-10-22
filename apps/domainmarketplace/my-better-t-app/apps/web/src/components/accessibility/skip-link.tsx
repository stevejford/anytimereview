import Link from "next/link";

export default function SkipLink() {
	return (
		<Link
			href="#main-content"
			className="sr-only absolute left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:z-50"
		>
			Skip to main content
		</Link>
	);
}


