"use client";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import Logo from "./logo";
import MainNav from "./navigation/main-nav";
import MobileNav from "./navigation/mobile-nav";
import { Separator } from "./ui/separator";
import { ModeSwitcher } from "./navigation/mode-switcher";
import { useMode } from "@/lib/hooks/use-mode";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function Header() {
	const { canAccessHostMode, hasCompletedOnboarding } = useMode();
	const { user, isSignedIn } = useUser();

	return (
		<>
			{/* Skip to main content link for accessibility */}
			<a
				href="#main-content"
				className="sr-only absolute left-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:z-50"
			>
				Skip to main content
			</a>

			<header
				role="banner"
				className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
			>
				<div className="container mx-auto flex h-16 items-center justify-between px-4">
					{/* Left section - Logo and Main Navigation */}
					<div className="flex items-center gap-6">
						<Logo />
						<MainNav />
					</div>

					{/* Right section - List your domain CTA, Mode switcher, Theme toggle and User menu */}
					<div className="flex items-center gap-2">
						{/* Show "List your domain" CTA if user is authenticated but hasn't completed onboarding */}
						{isSignedIn && !hasCompletedOnboarding && (
							<Button
								asChild
								variant="default"
								className="hidden sm:flex"
								aria-label="List your domain"
							>
								<Link href="/list-your-domain">
									<PlusCircle className="size-4" />
									List your domain
								</Link>
							</Button>
						)}

						{/* Show mode switcher if user has completed onboarding */}
						{canAccessHostMode && <ModeSwitcher />}

						<ModeToggle />
						<UserMenu />
						<MobileNav />
					</div>
				</div>
			</header>
		</>
	);
}
