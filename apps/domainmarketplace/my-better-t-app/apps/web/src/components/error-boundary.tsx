"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export default class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Log error to console (can be replaced with error tracking service like Sentry)
		console.error("Error caught by boundary:", error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className="container mx-auto max-w-2xl py-12">
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Something went wrong</AlertTitle>
						<AlertDescription className="mt-2 space-y-4">
							<p>
								{this.state.error?.message ||
									"An unexpected error occurred. Please try again."}
							</p>
							<Button onClick={this.handleReset} variant="outline" size="sm">
								Try Again
							</Button>
						</AlertDescription>
					</Alert>
				</div>
			);
		}

		return this.props.children;
	}
}


