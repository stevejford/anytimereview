"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ToggleGroupType = "single";

interface ToggleGroupContextValue {
	type: ToggleGroupType;
	value: string | undefined;
	onItemSelect: (value: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(
	null,
);

interface ToggleGroupProps {
	type: ToggleGroupType;
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	className?: string;
	children: React.ReactNode;
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
	(
		{
			type,
			value,
			defaultValue,
			onValueChange,
			className,
			children,
		},
		ref,
	) => {
		const isControlled = value !== undefined;
		const [internalValue, setInternalValue] = React.useState<string | undefined>(
			defaultValue,
		);
		const currentValue = isControlled ? value : internalValue;

		const handleSelect = React.useCallback(
			(newValue: string) => {
				if (!isControlled) {
					setInternalValue(newValue);
				}
				onValueChange?.(newValue);
			},
			[isControlled, onValueChange],
		);

		const contextValue = React.useMemo(
			() => ({
				type,
				value: currentValue,
				onItemSelect: handleSelect,
			}),
			[type, currentValue, handleSelect],
		);

		return (
			<ToggleGroupContext.Provider value={contextValue}>
				<div
					ref={ref}
					role="group"
					className={cn(
						"bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center gap-1 rounded-lg p-[3px]",
						className,
					)}
				>
					{children}
				</div>
			</ToggleGroupContext.Provider>
		);
	},
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps
	extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
	value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
	({ value, className, children, onClick, disabled, ...props }, ref) => {
		const context = React.useContext(ToggleGroupContext);
		const selected = context?.value === value;

		return (
			<button
				type="button"
				ref={ref}
				data-state={selected ? "on" : "off"}
				aria-pressed={selected}
				disabled={disabled}
				onClick={(event) => {
					onClick?.(event);
					if (event.defaultPrevented || disabled) return;
					if (context && context.type === "single" && context.value !== value) {
						context.onItemSelect(value);
					}
				}}
				className={cn(
					"data-[state=on]:bg-background data-[state=on]:text-foreground inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
					selected ? "shadow-sm" : "text-muted-foreground",
					className,
				)}
				{...props}
			>
				{children}
			</button>
		);
	},
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
