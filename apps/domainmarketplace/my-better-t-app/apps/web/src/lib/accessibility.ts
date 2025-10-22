/**
 * Accessibility utility functions for WCAG 2.1 AA compliance
 */

/**
 * Generate a descriptive ARIA label for screen readers
 */
export function generateAriaLabel(context: string, item: string): string {
	return `${context} ${item}`;
}

/**
 * Announce a message to screen readers using a live region
 */
export function announceToScreenReader(
	message: string,
	priority: "polite" | "assertive" = "polite"
): void {
	// Create or get the live region
	let liveRegion = document.querySelector(
		`[data-live-region="${priority}"]`
	) as HTMLElement;

	if (!liveRegion) {
		liveRegion = document.createElement("div");
		liveRegion.setAttribute("data-live-region", priority);
		liveRegion.setAttribute("aria-live", priority);
		liveRegion.setAttribute("aria-atomic", "true");
		liveRegion.setAttribute("role", "status");
		liveRegion.className = "sr-only";
		document.body.appendChild(liveRegion);
	}

	// Clear previous message
	liveRegion.textContent = "";

	// Announce the new message after a brief delay to ensure it's picked up
	setTimeout(() => {
		liveRegion.textContent = message;
	}, 100);
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'textarea:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	];

	return Array.from(
		container.querySelectorAll<HTMLElement>(focusableSelectors.join(","))
	).filter((el) => {
		// Filter out elements that are not visible
		return (
			el.offsetWidth > 0 ||
			el.offsetHeight > 0 ||
			el.getClientRects().length > 0
		);
	});
}

/**
 * Trap focus within a container when Tab key is pressed
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
	if (event.key !== "Tab") return;

	const focusableElements = getFocusableElements(container);
	if (focusableElements.length === 0) return;

	const firstElement = focusableElements[0];
	const lastElement = focusableElements[focusableElements.length - 1];

	// If shift + tab (going backwards)
	if (event.shiftKey) {
		if (document.activeElement === firstElement) {
			event.preventDefault();
			lastElement.focus();
		}
	} else {
		// Just tab (going forward)
		if (document.activeElement === lastElement) {
			event.preventDefault();
			firstElement.focus();
		}
	}
}


