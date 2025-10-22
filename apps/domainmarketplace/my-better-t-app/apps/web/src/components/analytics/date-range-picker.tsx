"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export type DateRange = {
	from?: Date;
	to?: Date;
};

interface PresetRange {
	label: string;
	value: Required<DateRange>;
}

interface DateRangePickerProps {
	value: DateRange;
	onChange: (range: DateRange) => void;
	presets?: PresetRange[];
}

function formatRange(range: DateRange): string {
	const { from, to } = range;
	if (from && to) {
		return `${format(from, "MMM d, yyyy")} — ${format(to, "MMM d, yyyy")}`;
	}
	if (from) {
		return `${format(from, "MMM d, yyyy")} — Pick end`;
	}
	return "Pick a date range";
}

export function DateRangePicker({ value, onChange, presets }: DateRangePickerProps) {
	const [open, setOpen] = useState(false);

const today = useMemo(() => new Date(), []);
const disabledBefore = useMemo(() => {
	if (value.to) {
		return undefined;
	}
	return undefined;
}, [value.to]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={cn(
						"justify-start text-left font-normal",
						!value.from && !value.to && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{formatRange(value)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<div className="flex flex-col gap-4 p-4 sm:flex-row">
					{presets && presets.length > 0 && (
						<div className="flex w-full flex-col gap-2 sm:w-40">
							{presets.map((preset) => (
								<Button
									key={preset.label}
									variant="ghost"
									className="justify-start"
									onClick={() => {
										setOpen(false);
										onChange(preset.value);
									}}
								>
									{preset.label}
								</Button>
							))}
						</div>
					)}
					<Calendar
						initialFocus
						mode="range"
						numberOfMonths={2}
						selected={value}
						onSelect={(range) => {
						onChange(range ?? {});
						}}
						defaultMonth={value.from}
						disableNavigation={false}
						disabled={(date) =>
						Boolean(disabledBefore && date < disabledBefore) || date > today
						}
					/>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export default DateRangePicker;

