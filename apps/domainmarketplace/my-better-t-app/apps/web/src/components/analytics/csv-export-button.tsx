"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CsvColumn {
	key: string;
	label: string;
}

interface CsvExportButtonProps {
	data: Array<Record<string, unknown>>;
	columns: CsvColumn[];
	filename: string;
}

function escapeCsvValue(value: unknown): string {
	if (value === null || value === undefined) {
		return "";
	}
	const stringValue = String(value);
	if (/[,\n"]/.test(stringValue)) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

export function CsvExportButton({ data, columns, filename }: CsvExportButtonProps) {
	const [isExporting, setIsExporting] = useState(false);

	async function handleExport() {
		setIsExporting(true);
		try {
			const header = columns.map((column) => column.label).join(",");
			const rows = data.map((row) =>
				columns.map((column) => escapeCsvValue(row[column.key])).join(","),
			);
			const csvContent = [header, ...rows].join("\r\n");
			const blob = new Blob([csvContent], {
				type: "text/csv;charset=utf-8;",
			});
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
			document.body.appendChild(anchor);
			anchor.click();
			document.body.removeChild(anchor);
			URL.revokeObjectURL(url);
		} finally {
			setIsExporting(false);
		}
	}

	return (
		<Button onClick={handleExport} disabled={isExporting} variant="outline">
			{isExporting ? (
				<Loader2 className="mr-2 h-4 w-4 animate-spin" />
			) : (
				<Download className="mr-2 h-4 w-4" />
			)}
			Export CSV
		</Button>
	);
}

export default CsvExportButton;



