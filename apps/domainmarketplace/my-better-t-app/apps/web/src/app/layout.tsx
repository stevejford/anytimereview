import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import { ClerkProvider } from "@clerk/nextjs";
import Providers from "@/components/providers";
import Header from "@/components/header";
import Footer from "@/components/footer";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "HireADomain - Premium Domain Marketplace",
	description: "Hire premium domains for your marketing campaigns. Flexible pricing, instant setup, transparent fees.",
	openGraph: {
		title: "HireADomain - Premium Domain Marketplace",
		description: "Hire premium domains for your marketing campaigns. Flexible pricing, instant setup, transparent fees.",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "HireADomain - Premium Domain Marketplace",
		description: "Hire premium domains for your marketing campaigns.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
				>
					<Providers>
						<Header />
						<main id="main-content" className="flex-1" aria-label="Main content">
							{children}
						</main>
						<Footer />
					</Providers>
				</body>
			</html>
		</ClerkProvider>
	);
}
