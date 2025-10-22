"use client";

import { useCallback, useMemo, useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { bulkCreateRoutes } from "@/lib/api-client";
import type { BulkCreateRoutesResponse, CreateRouteRequest } from "@/lib/api-client";
import { toast } from "sonner";
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";

const rowSchema = z.object({
  host: z.string().min(1, "Host is required"),
  path: z
    .string()
    .min(1, "Path is required")
    .regex(/^(\/[^?#]*)?$/, "Path must start with '/' and not include query or hash"),
  targetUrl: z
    .string()
    .url("Target URL must be a valid URL")
    .refine((value) => /^(https?):\/\//.test(value), "Target URL must use http or https"),
  redirectCode: z.preprocess(
    (val) => (typeof val === "string" || typeof val === "number" ? Number(val) : undefined),
    z
      .number({ invalid_type_error: "Redirect code must be a number" })
      .int("Redirect code must be a whole number")
      .refine((value) => [301, 302, 307, 308].includes(value), {
        message: "Redirect code must be one of 301, 302, 307, or 308",
      }),
  ),
});

type RowResult = {
  routes: CreateRouteRequest[];
  errors: Array<{ index: number; errors: Array<{ field: string; message: string }> }>;
};

const csvTemplate = `host,path,targetUrl,redirectCode
apex,/,https://example.com,302
www,/pricing,https://example.com/pricing,302
`;

export interface BulkUploadDialogProps {
  hireId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (count: number) => void;
}

export function BulkUploadDialog({
  hireId,
  isOpen,
  onOpenChange,
  onSuccess,
}: BulkUploadDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvData, setCsvData] = useState<string>("");
  const [results, setResults] = useState<RowResult>({ routes: [], errors: [] });
  const [uploadResult, setUploadResult] = useState<BulkCreateRoutesResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep(1);
    setCsvData("");
    setResults({ routes: [], errors: [] });
    setUploadResult(null);
    setIsUploading(false);
    setParseError(null);
  }, []);

  const parseCsv = useCallback((input: string) => {
    setParseError(null);
    const parsedRoutes: CreateRouteRequest[] = [];
    const errors: RowResult["errors"] = [];

    Papa.parse<Record<string, unknown>>(input, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      error: (error) => {
        setParseError(error.message);
      },
      complete: (results) => {
        results.data.forEach((row, index) => {
          const parsed = rowSchema.safeParse(row);
          if (parsed.success) {
            const { host, path, targetUrl, redirectCode } = parsed.data;
            parsedRoutes.push({
              host,
              path,
              targetUrl,
              redirectCode,
            });
          } else {
            const rowErrors = parsed.error.issues.map((issue) => ({
              field: issue.path.join(".") || "row",
              message: issue.message,
            }));
            errors.push({ index, errors: rowErrors });
          }
        });

        setResults({ routes: parsedRoutes, errors });
        setStep(2);
      },
    });
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === "string") {
          setCsvData(text);
          parseCsv(text);
        }
      };
      reader.onerror = () => {
        setParseError("Unable to read file");
      };
      reader.readAsText(file);
    },
    [parseCsv],
  );

  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    try {
      const response = await bulkCreateRoutes(hireId, results.routes);
      setUploadResult(response);
      onSuccess?.(response.summary.created);
      toast.success(`Created ${response.summary.created} routes`);
      setStep(3);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Unable to upload routes");
    } finally {
      setIsUploading(false);
    }
  }, [hireId, results.routes, onSuccess]);

  const validCount = results.routes.length;
  const errorCount = results.errors.length;
  const totalCount = validCount + errorCount;

  const previewRows = useMemo(() => results.routes.slice(0, 5), [results.routes]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          resetState();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Routes</DialogTitle>
          <DialogDescription>
            Import multiple routes from a CSV to streamline configuration.
          </DialogDescription>
        </DialogHeader>

        {parseError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Parsing error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
          const inputEl = document.createElement("input");
          inputEl.type = "file";
          inputEl.accept = ".csv,text/csv";
          inputEl.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
              handleFile(file);
            }
          };
          inputEl.click();
                    }}
                  >
                    <Upload className="h-4 w-4" /> Choose CSV File
                  </Button>
                  <Textarea
                    placeholder="Paste CSV data here"
                    value={csvData}
                    onChange={(event) => setCsvData(event.target.value)}
                    className="min-h-40"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => parseCsv(csvData)}
                      disabled={!csvData.trim()}
                    >
                      Parse CSV
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setCsvData(csvTemplate)}
                    >
                      Load example
                    </Button>
                  </div>
                </div>
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Format requirements</AlertTitle>
                  <AlertDescription>
                    CSV must include headers: host, path, targetUrl, redirectCode.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{validCount} valid</Badge>
              <Badge variant={errorCount > 0 ? "destructive" : "outline"}>
                {errorCount} errors
              </Badge>
              <Badge variant="outline">{totalCount} total rows</Badge>
            </div>

            {errorCount > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Fix errors before uploading</AlertTitle>
                <AlertDescription className="space-y-2">
                  {results.errors.map((entry) => (
                    <div key={entry.index}>
                      <div className="font-semibold">Row {entry.index + 2}</div>
                      <ul className="list-disc pl-5 text-sm">
                        {entry.errors.map((issue, issueIndex) => (
                          <li key={issueIndex}>
                            {issue.field}: {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {previewRows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
                    <span>Host</span>
                    <span>Path</span>
                    <span>Target URL</span>
                    <span>Code</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {previewRows.map((route, index) => (
                      <div
                        key={`${route.host}-${route.path}-${index}`}
                        className="grid grid-cols-4 gap-4 text-sm"
                      >
                        <span>{route.host}</span>
                        <span>{route.path}</span>
                        <span className="truncate" title={route.targetUrl}>
                          {route.targetUrl}
                        </span>
                        <Badge variant="outline">{route.redirectCode}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 3 && uploadResult && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Total: {uploadResult.summary.total}</Badge>
                  <Badge variant="default">Created: {uploadResult.summary.created}</Badge>
                  <Badge variant="destructive">Failed: {uploadResult.summary.failed}</Badge>
                </div>
                <Progress value={(uploadResult.summary.created / uploadResult.summary.total) * 100} />
              </CardContent>
            </Card>
            {uploadResult.failed.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>{uploadResult.failed.length} routes failed</AlertTitle>
                <AlertDescription className="space-y-2">
                  {uploadResult.failed.map((entry) => (
                    <div key={entry.index}>
                      <div className="font-semibold">Row {entry.index + 2}</div>
                      <ul className="list-disc pl-5 text-sm">
                        {entry.errors.map((issue, issueIndex) => (
                          <li key={issueIndex}>
                            {issue.field}: {issue.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
          {step > 1 && step < 3 && (
            <Button type="button" variant="ghost" onClick={() => setStep((prev) => (prev === 2 ? 1 : prev))}>
              Back
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Close
            </Button>
            {step === 1 && (
              <Button
                type="button"
                onClick={() => parseCsv(csvData)}
                disabled={!csvData.trim()}
              >
                Continue
              </Button>
            )}
            {step === 2 && (
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading || validCount === 0 || errorCount > 0}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            )}
            {step === 3 && (
              <Button
                type="button"
                onClick={() => {
                  resetState();
                  setStep(1);
                }}
              >
                Upload more
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkUploadDialog;
