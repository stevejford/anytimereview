"use client";

import { useEffect, useRef } from "react";

interface FocusTrapProps {
	children: React.ReactNode;
	active: boolean;
}

export default function FocusTrap({ children, active }: FocusTrapProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!active) return;

		// Store the previously focused element
		previousFocusRef.current = document.activeElement as HTMLElement;

		const container = containerRef.current;
		if (!container) return;

		// Get all focusable elements
		const getFocusableElements = () => {
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
				return (
					el.offsetWidth > 0 ||
					el.offsetHeight > 0 ||
					el.getClientRects().length > 0
				);
			});
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Tab") return;

			const focusableElements = getFocusableElements();
			if (focusableElements.length === 0) return;

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];

			// If shift + tab (going backwards)
			if (e.shiftKey) {
				if (document.activeElement === firstElement) {
					e.preventDefault();
					lastElement.focus();
				}
			} else {
				// Just tab (going forward)
				if (document.activeElement === lastElement) {
					e.preventDefault();
					firstElement.focus();
				}
			}
		};

		// Focus first focusable element on mount
		const focusableElements = getFocusableElements();
		if (focusableElements.length > 0) {
			focusableElements[0].focus();
		}

		// Add event listener
		container.addEventListener("keydown", handleKeyDown);

		return () => {
			container.removeEventListener("keydown", handleKeyDown);
			// Restore focus to previous element
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
			}
		};
	}, [active]);

	return <div ref={containerRef}>{children}</div>;
}


