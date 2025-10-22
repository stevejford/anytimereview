"use client";

import Link from "next/link";

export default function Logo() {
	return (
		<Link
			href="/"
			className="text-xl font-bold transition-opacity hover:opacity-80"
			aria-label="HireADomain Home"
		>
			HireADomain
		</Link>
	);
}


