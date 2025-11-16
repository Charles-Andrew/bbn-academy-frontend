"use client";

import { Download, FileDown, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ExportButtonProps {
  selectedMessageIds?: string[];
  onExport: (options: ExportOptions) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

interface ExportOptions {
  format: "csv" | "json";
  filters: {
    status?: string;
    purpose?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
  includeAttachments: boolean;
  messageIds?: string[];
}

interface ExportTemplate {
  name: string;
  description: string;
  filters: Partial<ExportOptions["filters"]>;
}

export function ExportButton({
  selectedMessageIds,
  onExport,
  disabled = false,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    filters: {},
    includeAttachments: false,
    messageIds: selectedMessageIds,
  });

  const exportTemplates: ExportTemplate[] = [
    {
      name: "All Messages",
      description: "Export all messages regardless of status",
      filters: {},
    },
    {
      name: "Unread Messages Only",
      description: "Export only unread messages",
      filters: { status: "unread" },
    },
    {
      name: "Last 30 Days",
      description: "Export messages from the last 30 days",
      filters: {
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    },
    {
      name: "This Month",
      description: "Export messages from the current month",
      filters: {
        dateFrom: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0],
      },
    },
    {
      name: "Book Inquiries Only",
      description: "Export only book-related inquiries",
      filters: { purpose: "Book Inquiry" },
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportOptions);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      await onExport({
        ...exportOptions,
        format,
      });
    } catch (error) {
      console.error("Quick export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const applyTemplate = (template: ExportTemplate) => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...template.filters,
      },
    }));
  };

  const hasSelection = selectedMessageIds && selectedMessageIds.length > 0;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      {/* Quick Export Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isExporting}
            className={cn("flex items-center gap-2", className)}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
                {hasSelection && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {selectedMessageIds.length}
                  </span>
                )}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleQuickExport("csv")}>
            <FileDown className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleQuickExport("json")}>
            <FileDown className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Export Options
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Export Options Dialog */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Messages</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Export Scope</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              {hasSelection ? (
                <p className="text-sm">
                  Exporting <strong>{selectedMessageIds.length}</strong>{" "}
                  selected message{selectedMessageIds.length !== 1 ? "s" : ""}
                </p>
              ) : (
                <p className="text-sm">
                  Exporting all messages that match the filters below
                </p>
              )}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label
              htmlFor="export-format"
              className="text-sm font-medium mb-2 block"
            >
              Export Format
            </label>
            <Select
              value={exportOptions.format}
              onValueChange={(value: "csv" | "json") =>
                setExportOptions((prev) => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger id="export-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div>
                    <div className="font-medium">CSV</div>
                    <div className="text-sm text-muted-foreground">
                      Spreadsheet-compatible format
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div>
                    <div className="font-medium">JSON</div>
                    <div className="text-sm text-muted-foreground">
                      Structured data format for developers
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters */}
          {!hasSelection && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Filters</h3>

              {/* Quick Templates */}
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Quick Templates</h4>
                <div className="grid gap-2">
                  {exportTemplates.map((template) => (
                    <button
                      type="button"
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      className="text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Filters */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="export-status"
                    className="text-sm font-medium mb-2 block"
                  >
                    Status
                  </label>
                  <Select
                    value={exportOptions.filters.status || "all"}
                    onValueChange={(value) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          status: value === "all" ? undefined : value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger id="export-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <fieldset>
                  <legend className="text-sm font-medium mb-2 block">
                    Date Range
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={exportOptions.filters.dateFrom || ""}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            dateFrom: e.target.value || undefined,
                          },
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="From date"
                    />
                    <input
                      type="date"
                      value={exportOptions.filters.dateTo || ""}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          filters: {
                            ...prev.filters,
                            dateTo: e.target.value || undefined,
                          },
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="To date"
                    />
                  </div>
                </fieldset>
              </div>
            </div>
          )}

          {/* Options */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Options</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-attachments"
                  checked={exportOptions.includeAttachments}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeAttachments: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="include-attachments"
                  className="text-sm font-medium"
                >
                  Include attachment information
                </label>
              </div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export Messages
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
