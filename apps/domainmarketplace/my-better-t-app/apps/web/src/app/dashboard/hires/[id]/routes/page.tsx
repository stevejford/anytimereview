"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  deleteRoute,
  getHire,
  getRoutes,
  type Hire,
  type Route,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/listings/data-table";
import { columns } from "@/components/routes/columns";
import { RouteDialog } from "@/components/routes/route-dialog";
import { BulkUploadDialog } from "@/components/routes/bulk-upload-dialog";
import Breadcrumbs from "@/components/navigation/breadcrumbs";
import { announceToScreenReader } from "@/lib/accessibility";

export default function RoutesPage() {
  const params = useParams();
  const hireId = params?.id as string | undefined;
  const queryClient = useQueryClient();

  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const hireQuery = useQuery<Hire>({
    queryKey: ["hire", hireId],
    queryFn: () => getHire(hireId!),
    enabled: Boolean(hireId),
  });

  const routesQuery = useQuery<Route[]>({
    queryKey: ["routes", hireId],
    queryFn: () => getRoutes(hireId!),
    enabled: Boolean(hireId),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ hireId, routeId }: { hireId: string; routeId: string }) =>
      deleteRoute(hireId, routeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["routes", hireId] });
      toast.success("Route deleted");
      announceToScreenReader("Route deleted successfully");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to delete route";
      toast.error(message);
      announceToScreenReader(`Error: ${message}`, "assertive");
    },
  });

  const handleCreate = () => {
    setSelectedRoute(null);
    setIsRouteDialogOpen(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsRouteDialogOpen(true);
  };

  const handleDelete = (route: Route) => {
    const confirmed = window.confirm(
      `Delete route ${route.host}${route.path}? This action cannot be undone.`,
    );
    if (!confirmed || !hireId) return;
    deleteMutation.mutate({ hireId, routeId: route.id });
  };

  const handleRouteSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ["routes", hireId] });
    setSelectedRoute(null);
    toast.success("Route saved");
    announceToScreenReader("Route configuration saved successfully");
  };

  const handleBulkSuccess = async (count: number) => {
    await queryClient.invalidateQueries({ queryKey: ["routes", hireId] });
    toast.success(`Created ${count} routes`);
    setIsBulkDialogOpen(false);
  };

  if (hireQuery.isLoading || routesQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (hireQuery.isError || !hireQuery.data) {
    const message = hireQuery.error instanceof Error
      ? hireQuery.error.message
      : "Unable to load hire";

    return (
      <Alert variant="destructive">
        <AlertTitle>Access denied</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  const hire = hireQuery.data;
  const routes = routesQuery.data ?? [];
  const fqdn = hire.listing?.domain?.fqdn ?? "this domain";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs />
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href={`/dashboard/hires/${hire.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to hire
          </Link>
        </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Route configuration</h1>
          <p className="text-muted-foreground">
            Manage redirects for {fqdn}. Routes determine where visitors are sent when
            they load your hire domain.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add route
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" /> Bulk upload
          </Button>
        </div>
      </div>

      {routes.length === 0 && (
        <Alert>
          <AlertTitle>No routes yet</AlertTitle>
          <AlertDescription>
            Create your first route to start directing traffic. You can import from CSV or add
            routes manually.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Routes</CardTitle>
            <CardDescription>All configured redirects for this hire.</CardDescription>
          </div>
          <Badge variant="secondary">{routes.length} configured</Badge>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={routes}
            meta={{
              hireId,
              onEdit: handleEdit,
              onDelete: handleDelete,
              onRouteUpdated: (updatedRoute) => {
                queryClient.setQueryData<Route[]>(["routes", hireId], (previous) => {
                  if (!previous) return previous;
                  return previous.map((current) =>
                    current.id === updatedRoute.id ? updatedRoute : current,
                  );
                });
              },
            }}
            isLoading={routesQuery.isLoading}
            emptyMessage="No routes configured yet"
            searchPlaceholder="Search routes"
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={handleCreate}>
            Add route
          </Button>
        </CardFooter>
      </Card>

      {hireId && (
        <RouteDialog
          hireId={hireId}
          isOpen={isRouteDialogOpen}
          onOpenChange={(open) => {
            setIsRouteDialogOpen(open);
            if (!open) {
              setSelectedRoute(null);
            }
          }}
          route={selectedRoute}
          onSuccess={handleRouteSaved}
        />
      )}

      {hireId && (
        <BulkUploadDialog
          hireId={hireId}
          isOpen={isBulkDialogOpen}
          onOpenChange={setIsBulkDialogOpen}
          onSuccess={handleBulkSuccess}
        />
      )}
      </div>
    </div>
  );
}
