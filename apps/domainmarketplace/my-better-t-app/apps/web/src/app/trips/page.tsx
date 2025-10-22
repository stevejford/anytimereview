"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function TripsRedirect() {
	useEffect(() => {
		redirect("/hires");
	}, []);

	// Immediate redirect on render
	redirect("/hires");
}

