"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { Route, CreateRouteRequest, UpdateRouteRequest } from "@/lib/api-client";
import { createRoute, updateRoute } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const redirectCodeOptions = [301, 302, 307, 308] as const;

const subdomainRegex = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/i;

const schema = z
  .object({
    hostType: z.enum(["apex", "www", "custom"]),
    hostValue: z
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .refine(
        (value) => value === undefined || subdomainRegex.test(value),
        "Enter a valid subdomain (letters, numbers, hyphens)",
      )
      .optional(),
    path: z
      .string()
      .trim()
      .min(1, "Path is required")
      .regex(/^(\/[^?#]*)?$/, "Path must start with '/' and not include query or hash"),
    targetUrl: z
      .string()
      .trim()
      .url("Target URL must be a valid URL")
      .refine((value) => /^(https?):\/\//.test(value), "Target URL must use http or https"),
    redirectCode: z.enum(["301", "302", "307", "308"]).transform(Number),
  })
  .superRefine((data, ctx) => {
    if (data.hostType === "custom" && !data.hostValue) {
      ctx.addIssue({
        path: ["hostValue"],
        code: z.ZodIssueCode.custom,
        message: "Subdomain is required when host type is custom",
      });
    }
  });

type Schema = z.infer<typeof schema>;

const defaultValues: Schema = {
  hostType: "apex",
  hostValue: undefined,
  path: "/",
  targetUrl: "",
  redirectCode: 302,
};

export interface RouteDialogProps {
  hireId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  route?: Route | null;
  onSuccess?: (route: Route) => void;
}

export function RouteDialog({
  hireId,
  isOpen,
  onOpenChange,
  route,
  onSuccess,
}: RouteDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const isEditMode = Boolean(route);

  useEffect(() => {
    if (route) {
      form.reset({
        hostType: route.host === "apex" || route.host === "www" ? route.host : "custom",
        hostValue: route.host !== "apex" && route.host !== "www" ? route.host : undefined,
        path: route.path,
        targetUrl: route.targetUrl,
        redirectCode: route.redirectCode,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [route, form, isOpen]);

  async function handleSubmit(values: Schema) {
    setIsSubmitting(true);
    setError(null);

    const hostType = values.hostType;
    const hostValue = values.hostValue?.trim();
    const host = hostType === "custom" ? hostValue! : hostType;

    const payload: CreateRouteRequest | UpdateRouteRequest = {
      host,
      path: values.path.trim(),
      targetUrl: values.targetUrl.trim(),
      redirectCode: values.redirectCode,
    };

    try {
      let response: Route;

      if (isEditMode && route) {
        response = await updateRoute(hireId, route.id, payload);
      } else {
        response = await createRoute(hireId, payload as CreateRouteRequest);
      }

      onSuccess?.(response);
      onOpenChange(false);
      form.reset(defaultValues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Route" : "Create Route"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update redirect settings for this domain path."
              : "Configure where visitors are redirected for this domain path."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to save route</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <TooltipProvider>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <FormField
                control={form.control}
                name="hostType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select host" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apex">Apex (@)</SelectItem>
                          <SelectItem value="www">WWW</SelectItem>
                          <SelectItem value="custom">Custom subdomain</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription className="flex items-center gap-2 text-sm">
                      Map different subdomains to unique destinations.
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Apex applies to example.com, WWW applies to www.example.com. Use
                          custom to specify another subdomain.
                        </TooltipContent>
                      </Tooltip>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hostValue"
                render={({ field }) => {
                  const hostType = form.watch("hostType");
                  if (hostType !== "custom") {
                    return null;
                  }

                  return (
                    <FormItem>
                      <FormLabel>Custom subdomain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="blog"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value === "" ? undefined : event.target.value)
                          }
                        />
                      </FormControl>
                      <FormDescription>Subdomain only. Example: blog for blog.example.com</FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input placeholder="/products" {...field} />
                    </FormControl>
                    <FormDescription className="flex items-center gap-2 text-sm">
                      Exact path that triggers this redirect.
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Use / for the homepage. Paths are case-sensitive and do not support
                          wildcards.
                        </TooltipContent>
                      </Tooltip>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/destination" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full URL where visitors will be redirected.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="redirectCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redirect code</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select redirect code" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="302">302 – Temporary (Recommended)</SelectItem>
                          <SelectItem value="307">307 – Temporary (preserves method)</SelectItem>
                          <SelectItem value="301">301 – Permanent</SelectItem>
                          <SelectItem value="308">308 – Permanent (preserves method)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription className="flex items-start gap-2 text-sm">
                      Choose based on contract duration.
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="mt-1 h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-left">
                          Hires should default to temporary codes (302/307) to protect domain
                          SEO equity. Use 301/308 only for permanent, exclusive arrangements.
                        </TooltipContent>
                      </Tooltip>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? "Update Route" : "Create Route"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

export default RouteDialog;
