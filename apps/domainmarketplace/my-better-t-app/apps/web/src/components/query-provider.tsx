"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";

interface QueryProviderProps {
	children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
	const [queryClient] = React.useState(() => new QueryClient());

	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}


