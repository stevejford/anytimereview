"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";
import QueryProvider from "./query-provider";
import { ModeProvider } from "@/lib/hooks/use-mode";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryProvider>
				<ModeProvider>{children}</ModeProvider>
			</QueryProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
