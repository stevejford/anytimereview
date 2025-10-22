import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User } from '@clerk/nextjs/server';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// ============================================================================
// Color Utility Functions
// ============================================================================

/**
 * Get the teal color hex value from the custom color palette
 * @returns {string} The hex color value #00cf9b
 * @example
 * const tealColor = getTealColor(); // "#00cf9b"
 */
export function getTealColor(): string {
	return "#00cf9b";
}

/**
 * Get the red color hex value from the custom color palette
 * @returns {string} The hex color value #f71f46
 * @example
 * const redColor = getRedColor(); // "#f71f46"
 */
export function getRedColor(): string {
	return "#f71f46";
}

/**
 * Get the purple color hex value from the custom color palette
 * @returns {string} The hex color value #6c56b0
 * @example
 * const purpleColor = getPurpleColor(); // "#6c56b0"
 */
export function getPurpleColor(): string {
	return "#6c56b0";
}

/**
 * Get the dark background color hex value from the custom color palette
 * @returns {string} The hex color value #1c1e2e
 * @example
 * const darkBgColor = getDarkBgColor(); // "#1c1e2e"
 */
export function getDarkBgColor(): string {
	return "#1c1e2e";
}

// ============================================================================
// OKLCH Color Functions
// ============================================================================

/**
 * Get the teal color in OKLCH format
 * @returns {string} The OKLCH color string
 * @example
 * const tealOklch = getTealOklch(); // "oklch(0.756 0.153 190.6)"
 */
export function getTealOklch(): string {
	return "oklch(0.756 0.153 190.6)";
}

/**
 * Get the red color in OKLCH format
 * @returns {string} The OKLCH color string
 * @example
 * const redOklch = getRedOklch(); // "oklch(0.626 0.239 20.2)"
 */
export function getRedOklch(): string {
	return "oklch(0.626 0.239 20.2)";
}

/**
 * Get the purple color in OKLCH format
 * @returns {string} The OKLCH color string
 * @example
 * const purpleOklch = getPurpleOklch(); // "oklch(0.519 0.137 290.6)"
 */
export function getPurpleOklch(): string {
	return "oklch(0.519 0.137 290.6)";
}

/**
 * Get the dark background color in OKLCH format
 * @returns {string} The OKLCH color string
 * @example
 * const darkBgOklch = getDarkBgOklch(); // "oklch(0.241 0.0306 277.1)"
 */
export function getDarkBgOklch(): string {
	return "oklch(0.241 0.0306 277.1)";
}

// ============================================================================
// Color Opacity Functions
// ============================================================================

/**
 * Get the teal color with specified opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGB color string with opacity
 * @example
 * const tealWithOpacity = getTealWithOpacity(0.5); // "rgb(0 207 155 / 0.5)"
 */
export function getTealWithOpacity(opacity: number): string {
	return `rgb(0 207 155 / ${opacity})`;
}

/**
 * Get the red color with specified opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGB color string with opacity
 * @example
 * const redWithOpacity = getRedWithOpacity(0.3); // "rgb(247 31 70 / 0.3)"
 */
export function getRedWithOpacity(opacity: number): string {
	return `rgb(247 31 70 / ${opacity})`;
}

/**
 * Get the purple color with specified opacity
 * @param {number} opacity - Opacity value between 0 and 1
 * @returns {string} RGB color string with opacity
 * @example
 * const purpleWithOpacity = getPurpleWithOpacity(0.2); // "rgb(108 86 176 / 0.2)"
 */
export function getPurpleWithOpacity(opacity: number): string {
	return `rgb(108 86 176 / ${opacity})`;
}

// ============================================================================
// Color Validation and Conversion
// ============================================================================

/**
 * Validate if a string is a valid hex color
 * @param {string} color - The color string to validate
 * @returns {boolean} True if valid hex color, false otherwise
 * @example
 * isValidHexColor("#00cf9b"); // true
 * isValidHexColor("invalid"); // false
 */
export function isValidHexColor(color: string): boolean {
	return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Convert hex color to RGB object
 * @param {string} hex - The hex color string (with or without #)
 * @returns {{ r: number; g: number; b: number } | null} RGB object or null if invalid
 * @example
 * hexToRgb("#00cf9b"); // { r: 0, g: 207, b: 155 }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
			}
		: null;
}



// ============================================================================
// Tailwind Class Helpers
// ============================================================================

/**
 * Get common teal-related Tailwind classes
 * @returns {object} Object containing teal-related class strings
 * @example
 * const tealClasses = getTealClasses();
 * // { bg: "bg-primary", text: "text-primary", border: "border-primary", ring: "ring-primary" }
 */
export function getTealClasses() {
	return {
		bg: "bg-primary",
		text: "text-primary",
		border: "border-primary",
		ring: "ring-primary",
		bgHover: "hover:bg-primary",
		textHover: "hover:text-primary",
		borderHover: "hover:border-primary",
		bgWithOpacity: (opacity: number) => `bg-primary/${Math.round(opacity * 100)}`,
		textWithOpacity: (opacity: number) => `text-primary/${Math.round(opacity * 100)}`,
		borderWithOpacity: (opacity: number) => `border-primary/${Math.round(opacity * 100)}`,
		ringWithOpacity: (opacity: number) => `ring-primary/${Math.round(opacity * 100)}`,
	};
}

/**
 * Get common red-related Tailwind classes
 * @returns {object} Object containing red-related class strings
 * @example
 * const redClasses = getRedClasses();
 * // { bg: "bg-destructive", text: "text-destructive", border: "border-destructive", ring: "ring-destructive" }
 */
export function getRedClasses() {
	return {
		bg: "bg-destructive",
		text: "text-destructive",
		border: "border-destructive",
		ring: "ring-destructive",
		bgHover: "hover:bg-destructive",
		textHover: "hover:text-destructive",
		borderHover: "hover:border-destructive",
		bgWithOpacity: (opacity: number) => `bg-destructive/${Math.round(opacity * 100)}`,
		textWithOpacity: (opacity: number) => `text-destructive/${Math.round(opacity * 100)}`,
		borderWithOpacity: (opacity: number) => `border-destructive/${Math.round(opacity * 100)}`,
		ringWithOpacity: (opacity: number) => `ring-destructive/${Math.round(opacity * 100)}`,
	};
}

/**
 * Get common purple-related Tailwind classes
 * @returns {object} Object containing purple-related class strings
 * @example
 * const purpleClasses = getPurpleClasses();
 * // { bg: "bg-secondary", text: "text-secondary", border: "border-secondary", ring: "ring-secondary" }
 */
export function getPurpleClasses() {
	return {
		bg: "bg-secondary",
		text: "text-secondary",
		border: "border-secondary",
		ring: "ring-secondary",
		bgHover: "hover:bg-secondary",
		textHover: "hover:text-secondary",
		borderHover: "hover:border-secondary",
		bgWithOpacity: (opacity: number) => `bg-secondary/${Math.round(opacity * 100)}`,
		textWithOpacity: (opacity: number) => `text-secondary/${Math.round(opacity * 100)}`,
		borderWithOpacity: (opacity: number) => `border-secondary/${Math.round(opacity * 100)}`,
		ringWithOpacity: (opacity: number) => `ring-secondary/${Math.round(opacity * 100)}`,
	};
}

/**
 * Get common dark background-related Tailwind classes
 * @returns {object} Object containing dark background-related class strings
 * @example
 * const darkBgClasses = getDarkBgClasses();
 * // { bg: "bg-background", text: "text-background", border: "border-background" }
 */
export function getDarkBgClasses() {
	return {
		bg: "bg-background",
		text: "text-background",
		border: "border-background",
		bgHover: "hover:bg-background",
		textHover: "hover:text-background",
		borderHover: "hover:border-background",
		bgWithOpacity: (opacity: number) => `bg-background/${Math.round(opacity * 100)}`,
		textWithOpacity: (opacity: number) => `text-background/${Math.round(opacity * 100)}`,
		borderWithOpacity: (opacity: number) => `border-background/${Math.round(opacity * 100)}`,
	};
}

// ============================================================================
// Onboarding and Mode Permission Utilities
// ============================================================================

/**
 * Interface for public metadata structure stored in Clerk user object
 */
export interface PublicMetadata {
	hasCompletedHostOnboarding?: boolean;
	role?: 'owner' | 'hirer' | 'admin';
}

/**
 * Check if a user has completed the host onboarding process
 *
 * @param user - The Clerk user object
 * @returns True if onboarding is complete, false otherwise
 *
 * @example
 * // In a React component with useUser hook
 * import { useUser } from '@clerk/nextjs';
 * import { hasCompletedOnboarding } from '@/lib/utils';
 *
 * const { user } = useUser();
 * const isOnboarded = hasCompletedOnboarding(user);
 *
 * @example
 * // In a server component
 * import { currentUser } from '@clerk/nextjs/server';
 * import { hasCompletedOnboarding } from '@/lib/utils';
 *
 * const user = await currentUser();
 * const isOnboarded = hasCompletedOnboarding(user);
 */
export function hasCompletedOnboarding(user: User | null | undefined): boolean {
	if (!user) return false;
	const metadata = user.publicMetadata as PublicMetadata | undefined;
	return metadata?.hasCompletedHostOnboarding === true;
}

/**
 * Determine if a user can access host mode features
 *
 * This is an alias for hasCompletedOnboarding() but provides better semantic clarity
 * when checking permissions for host-specific features.
 *
 * @param user - The Clerk user object
 * @returns True if user can access host mode, false otherwise
 *
 * @example
 * // Use this when checking feature access
 * if (canAccessHostMode(user)) {
 *   // Show host dashboard, listings, etc.
 * }
 *
 * @example
 * // Use hasCompletedOnboarding when checking onboarding flow
 * if (!hasCompletedOnboarding(user)) {
 *   router.push('/onboarding');
 * }
 */
export function canAccessHostMode(user: User | null | undefined): boolean {
	return hasCompletedOnboarding(user);
}

/**
 * Determine the default mode for a user based on their onboarding status
 *
 * @param user - The Clerk user object
 * @returns 'host' if onboarding is complete, 'browse' otherwise
 *
 * @example
 * // In mode provider initialization
 * import { useUser } from '@clerk/nextjs';
 * import { getDefaultMode } from '@/lib/utils';
 *
 * const { user } = useUser();
 * const [mode, setMode] = useState(getDefaultMode(user));
 */
export function getDefaultMode(user: User | null | undefined): 'browse' | 'host' {
	return hasCompletedOnboarding(user) ? 'host' : 'browse';
}

/**
 * Get detailed onboarding status information for a user
 *
 * @param user - The Clerk user object
 * @returns Object containing detailed status flags
 *
 * @example
 * // Check multiple conditions at once
 * const status = getUserOnboardingStatus(user);
 *
 * if (status.shouldRedirectToOnboarding) {
 *   router.push('/list-your-domain');
 * } else if (status.shouldRedirectToHostDashboard) {
 *   router.push('/host/dashboard');
 * }
 *
 * @example
 * // In middleware for route protection
 * const status = getUserOnboardingStatus(user);
 * if (isHostRoute && !status.canAccessHostMode) {
 *   return NextResponse.redirect('/list-your-domain');
 * }
 */
export function getUserOnboardingStatus(user: User | null | undefined) {
	const isAuthenticated = user !== null && user !== undefined;
	const hasCompleted = hasCompletedOnboarding(user);

	return {
		/** Whether user is logged in */
		isAuthenticated,
		/** Whether onboarding is complete */
		hasCompletedOnboarding: hasCompleted,
		/** Whether user can access host features */
		canAccessHostMode: hasCompleted,
		/** Whether user should be redirected to onboarding */
		shouldRedirectToOnboarding: isAuthenticated && !hasCompleted,
		/** Whether user should be redirected to host dashboard */
		shouldRedirectToHostDashboard: isAuthenticated && hasCompleted,
	};
}

/**
 * Update user metadata (client-side helper)
 *
 * This provides a type-safe way to update user metadata by calling the API endpoint.
 * Should be used after onboarding completion or when updating user roles.
 * The userId is automatically derived from the authenticated session on the server.
 *
 * @param metadata - Object containing one or more of: publicMetadata, privateMetadata, unsafeMetadata
 * @returns Promise resolving to the API response
 *
 * @example
 * // After completing onboarding
 * import { updateUserMetadata } from '@/lib/utils';
 *
 * await updateUserMetadata({
 *   publicMetadata: {
 *     hasCompletedHostOnboarding: true
 *   }
 * });
 *
 * @example
 * // Updating user role
 * await updateUserMetadata({
 *   publicMetadata: {
 *     role: 'owner'
 *   }
 * });
 *
 * @example
 * // Updating multiple metadata types
 * await updateUserMetadata({
 *   publicMetadata: {
 *     hasCompletedHostOnboarding: true
 *   },
 *   privateMetadata: {
 *     stripeCustomerId: 'cus_123'
 *   }
 * });
 */
export async function updateUserMetadata(metadata: {
	publicMetadata?: Partial<PublicMetadata> & { [key: string]: any };
	privateMetadata?: Record<string, any>;
	unsafeMetadata?: Record<string, any>;
}): Promise<Response> {
	return fetch('/api/user/metadata', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(metadata),
	});
}
