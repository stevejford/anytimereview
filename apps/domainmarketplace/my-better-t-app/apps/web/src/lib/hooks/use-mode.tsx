"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { hasCompletedOnboarding as checkOnboardingStatus, canAccessHostMode as checkHostModeAccess } from '@/lib/utils';

type Mode = "browse" | "host";

interface ModeContextType {
	mode: Mode;
	setMode: (mode: Mode) => void;
	isBrowseMode: boolean;
	isHostMode: boolean;
	switchToBrowse: () => void;
	switchToHost: () => void;
	canAccessHostMode: boolean;
	hasCompletedOnboarding: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
	const { user, isLoaded } = useUser();
	const router = useRouter();
	const pathname = usePathname();

	// Check if user has completed host onboarding from Clerk metadata
	// Uses utility function from utils.ts for consistency across the app
	const hasCompletedOnboarding = checkOnboardingStatus(user);
	
	// Determine initial mode from localStorage or default to browse
	const [mode, setModeState] = useState<Mode>(() => {
		if (typeof window !== "undefined") {
			const stored = localStorage.getItem("userMode");
			if (stored === "host" || stored === "browse") {
				return stored as Mode;
			}
		}
		return "browse";
	});

	// Persist mode to localStorage
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("userMode", mode);
		}
	}, [mode]);

	// Auto-switch to browse mode if user hasn't completed onboarding
	useEffect(() => {
		if (isLoaded && mode === "host" && !hasCompletedOnboarding) {
			setModeState("browse");
		}
	}, [isLoaded, mode, hasCompletedOnboarding]);

	const setMode = (newMode: Mode) => {
		// Only allow host mode if user has completed onboarding
		if (newMode === "host" && !hasCompletedOnboarding) {
			console.warn("Cannot switch to host mode without completing onboarding");
			return;
		}
		setModeState(newMode);
	};

	const switchToBrowse = () => {
		setMode("browse");
		// Redirect to browse page if currently on host pages
		if (pathname?.startsWith("/host")) {
			router.push("/browse");
		}
	};

	const switchToHost = () => {
		if (!hasCompletedOnboarding) {
			// Redirect to onboarding if not completed
			router.push("/list-your-domain");
			return;
		}
		setMode("host");
		// Redirect to host dashboard if currently on browse pages
		if (!pathname?.startsWith("/host")) {
			router.push("/host/dashboard");
		}
	};

	const value: ModeContextType = {
		mode,
		setMode,
		isBrowseMode: mode === "browse",
		isHostMode: mode === "host",
		switchToBrowse,
		switchToHost,
		// canAccessHostMode uses the utility function indirectly via hasCompletedOnboarding
		canAccessHostMode: hasCompletedOnboarding,
		hasCompletedOnboarding,
	};

	return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
	const context = useContext(ModeContext);
	if (context === undefined) {
		throw new Error("useMode must be used within a ModeProvider");
	}
	return context;
}

