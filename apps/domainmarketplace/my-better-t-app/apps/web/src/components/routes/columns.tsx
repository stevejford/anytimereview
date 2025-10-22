"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { Route, UpdateRouteRequest } from "@/lib/api-client";
import { updateRoute } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const redirectCodeOptions = [301, 302, 307, 308];

type InlineEditState = {
	value: string;
	isDirty: boolean;
	isSubmitting: boolean;
	error?: string;
};

type RoutesTableMeta = {
  hireId: string;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
  onRouteUpdated?: (route: Route) => void;
};

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard");
  } catch (error) {
    toast.error("Unable to copy to clipboard");
  }
}

function useInlineField(initialValue: string) {
	const [state, setState] = useState<InlineEditState>({
		value: initialValue,
		isDirty: false,
		isSubmitting: false,
	});

	useEffect(() => {
		setState({ value: initialValue, isDirty: false, isSubmitting: false });
	}, [initialValue]);

	return [state, setState] as const;
}

async function commitUpdate(
  hireId: string,
  routeId: string,
  values: UpdateRouteRequest,
  setState: (updater: (prev: InlineEditState) => InlineEditState) => void,
  onRouteUpdated?: (route: Route) => void,
) {
  setState((prev) => ({ ...prev, isSubmitting: true, error: undefined }));
  try {
    const payload: UpdateRouteRequest = { ...values };
    const updated = await updateRoute(hireId, routeId, payload);
    onRouteUpdated?.(updated);
    toast.success("Route updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update route";
    toast.error(message);
    setState((prev) => ({ ...prev, error: message }));
  } finally {
    setState((prev) => ({ ...prev, isSubmitting: false, isDirty: false }));
  }
}

export const columns: ColumnDef<Route>[] = [
  {
    accessorKey: "host",
    header: "Host",
    cell: ({ row }) => {
      const host = row.getValue<string>("host");
      let variant: ComponentProps<typeof Badge>["variant"] = "outline";

      if (host === "apex" || host === "@") {
        variant = "default";
      } else if (host === "www") {
        variant = "secondary";
      }

      return <Badge variant={variant}>{host}</Badge>;
    },
  },
  {
    accessorKey: "path",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Path
        <ArrowUpDown className="h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const route = row.original;
      const meta = row.table.options.meta as RoutesTableMeta | undefined;
      const hireId = meta?.hireId ?? route.hireId;
      const onRouteUpdated = meta?.onRouteUpdated;
      const path = row.getValue<string>("path");
      const [state, setState] = useInlineField(path);

      const handleBlur = async () => {
        if (!state.isDirty || state.isSubmitting) return;
        const trimmed = state.value.trim();
        if (trimmed.length === 0) {
          const error = "Path is required";
          setState((prev) => ({ ...prev, error }));
          toast.error(error);
          return;
        }
        if (!/^(\/[^?#]*)?$/.test(trimmed)) {
          const error = "Path must start with '/' and not include query or hash";
          setState((prev) => ({ ...prev, error }));
          toast.error(error);
          return;
        }

        if (trimmed === route.path) {
          setState((prev) => ({ ...prev, value: trimmed, isDirty: false, error: undefined }));
          return;
        }

        setState((prev) => ({ ...prev, value: trimmed }));
        await commitUpdate(hireId, route.id, { path: trimmed }, setState, onRouteUpdated);
      };

      return (
        <div className="flex flex-col">
          <Input
            value={state.value}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                value: event.target.value,
                isDirty: true,
                error: undefined,
              }))
            }
            onBlur={handleBlur}
            onKeyDown={async (event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            disabled={state.isSubmitting}
            className={cn("h-9 font-mono text-sm", state.error ? "border-destructive" : undefined)}
            title={state.value}
          />
          {state.error && <span className="mt-1 text-xs text-destructive">{state.error}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "targetUrl",
    header: "Target URL",
    cell: ({ row }) => {
      const route = row.original;
      const meta = row.table.options.meta as RoutesTableMeta | undefined;
      const hireId = meta?.hireId ?? route.hireId;
      const onRouteUpdated = meta?.onRouteUpdated;
      const url = row.getValue<string>("targetUrl");
      const [state, setState] = useInlineField(url);

      const handleBlur = async () => {
        if (!state.isDirty || state.isSubmitting) return;
        const trimmed = state.value.trim();
        try {
          const parsedUrl = new URL(trimmed);
          if (!/^https?:$/.test(parsedUrl.protocol)) {
            throw new Error("Target URL must be http or https");
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Invalid URL";
          setState((prev) => ({ ...prev, error: message }));
          toast.error(message);
          return;
        }

        if (trimmed === route.targetUrl) {
          setState((prev) => ({ ...prev, value: trimmed, isDirty: false, error: undefined }));
          return;
        }

        setState((prev) => ({ ...prev, value: trimmed }));
        await commitUpdate(hireId, route.id, { targetUrl: trimmed }, setState, onRouteUpdated);
      };

      return (
        <div className="flex items-center gap-2 max-w-72">
          <Input
            value={state.value}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                value: event.target.value,
                isDirty: true,
                error: undefined,
              }))
            }
            onBlur={handleBlur}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            disabled={state.isSubmitting}
            className={cn("h-9 text-sm", state.error ? "border-destructive" : undefined)}
            title={state.value}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => copyToClipboard(url)}
            aria-label="Copy target URL"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            aria-label="Open target URL"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          {state.error && <span className="ml-2 text-xs text-destructive">{state.error}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "redirectCode",
    header: "Code",
    cell: ({ row }) => {
      const route = row.original;
      const meta = row.table.options.meta as RoutesTableMeta | undefined;
      const hireId = meta?.hireId ?? route.hireId;
      const onRouteUpdated = meta?.onRouteUpdated;
      const code = row.getValue<number>("redirectCode");
      const [state, setState] = useInlineField(String(code));

      const handleSelect = async (value: string) => {
        const nextCode = Number(value);

        if (!redirectCodeOptions.includes(nextCode)) {
          const error = "Redirect code must be 301, 302, 307, or 308";
          setState((prev) => ({ ...prev, value, error }));
          toast.error(error);
          return;
        }

        if (nextCode === route.redirectCode) {
          setState((prev) => ({ ...prev, value, error: undefined, isDirty: false }));
          return;
        }

        setState((prev) => ({ ...prev, value, isDirty: true, error: undefined }));
        await commitUpdate(hireId, route.id, { redirectCode: nextCode }, setState, onRouteUpdated);
      };

      const isPermanent = Number(state.value) === 301 || Number(state.value) === 308;

      return (
        <div className="flex flex-col">
          <Select
            value={state.value}
            onValueChange={handleSelect}
            disabled={state.isSubmitting}
          >
            <SelectTrigger className={cn("h-9 w-28", state.error ? "border-destructive" : undefined)}>
              <SelectValue placeholder="Select code" />
            </SelectTrigger>
            <SelectContent>
              {redirectCodeOptions.map((codeOption) => (
                <SelectItem key={codeOption} value={String(codeOption)}>
                  {codeOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge className="mt-1 w-fit" variant={isPermanent ? "default" : "secondary"}>
            {state.value}
          </Badge>
          {state.error && <span className="mt-1 text-xs text-destructive">{state.error}</span>}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row, table }) => {
      const route = row.original;
      const meta = table.options.meta as RoutesTableMeta | undefined;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => meta?.onEdit?.(route)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit route
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => window.open(route.targetUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-2 h-4 w-4" /> Test redirect
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copyToClipboard(route.targetUrl)}>
              <Copy className="mr-2 h-4 w-4" /> Copy target URL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => meta?.onDelete?.(route)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete route
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

