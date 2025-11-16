"use client";

import {
  Calendar,
  Filter,
  Grid,
  List,
  Plus,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Engagement,
  EngagementFilters,
  EngagementStatus,
  EngagementType,
} from "@/types/engagement";
import { EngagementCard } from "./EngagementCard";
import { EngagementForm } from "./EngagementForm";

interface EngagementListProps {
  className?: string;
}

const engagementTypes: { value: EngagementType; label: string }[] = [
  { value: "webinar", label: "Webinar" },
  { value: "workshop", label: "Workshop" },
  { value: "training", label: "Training" },
  { value: "coaching", label: "Coaching" },
  { value: "consulting", label: "Consulting" },
  { value: "speaking", label: "Speaking" },
  { value: "course", label: "Course" },
  { value: "event", label: "Event" },
];

const engagementStatuses: { value: EngagementStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions = [
  { value: "created_at", label: "Date Created" },
  { value: "updated_at", label: "Last Updated" },
  { value: "date", label: "Event Date" },
  { value: "title", label: "Title" },
  { value: "price", label: "Price" },
  { value: "status", label: "Status" },
];

export function EngagementList({ className }: EngagementListProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<EngagementFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchEngagements = useCallback(async (resetPage = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: resetPage ? "1" : pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.upcoming !== undefined && {
          upcoming: filters.upcoming.toString(),
        }),
        ...(filters.virtual !== undefined && {
          virtual: filters.virtual.toString(),
        }),
        ...(filters.featured !== undefined && {
          featured: filters.featured.toString(),
        }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      });

      const response = await fetch(`/api/admin/engagements?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEngagements(data.engagements);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch engagements");
      }
    } catch (error) {
      console.error("Error fetching engagements:", error);
      toast.error("Failed to fetch engagements");
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchEngagements();
  }, [fetchEngagements]);

  const handleCreateNew = () => {
    setEditingEngagement(null);
    setIsFormOpen(true);
  };

  const handleEdit = (engagement: Engagement) => {
    setEditingEngagement(engagement);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setEngagements(engagements.filter((e) => e.id !== id));
    fetchEngagements();
  };

  const handleUpdate = (updatedEngagement: Engagement) => {
    setEngagements(
      engagements.map((e) =>
        e.id === updatedEngagement.id ? updatedEngagement : e,
      ),
    );
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEngagement(null);
    fetchEngagements();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEngagement(null);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleFilterChange = (newFilters: Partial<EngagementFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, page: 1 });
  };

  const clearFilters = () => {
    setFilters({});
    setPagination({ ...pagination, page: 1 });
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(
      (value) => value !== undefined && value !== null && value !== false,
    ).length;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Engagements</h1>
          <p className="text-muted-foreground">
            Manage your workshops, webinars, coaching sessions, and more
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Engagement
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search engagements..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleFilters}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchEngagements()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label htmlFor="engagement-type-filter" className="text-sm font-medium mb-2 block">Type</label>
                  <Select
                    value={filters.type || ""}
                    onValueChange={(value) =>
                      handleFilterChange({
                        type: (value || undefined) as EngagementType,
                      })
                    }
                  >
                    <SelectTrigger id="engagement-type-filter">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {engagementTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="engagement-status-filter" className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <Select
                    value={filters.status || ""}
                    onValueChange={(value) =>
                      handleFilterChange({
                        status: (value || undefined) as EngagementStatus,
                      })
                    }
                  >
                    <SelectTrigger id="engagement-status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      {engagementStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Virtual Filter */}
                <div>
                  <label htmlFor="engagement-format-filter" className="text-sm font-medium mb-2 block">
                    Format
                  </label>
                  <Select
                    value={
                      filters.virtual === true
                        ? "virtual"
                        : filters.virtual === false
                          ? "in-person"
                          : ""
                    }
                    onValueChange={(value) =>
                      handleFilterChange({
                        virtual:
                          value === "virtual"
                            ? true
                            : value === "in-person"
                              ? false
                              : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="engagement-format-filter">
                      <SelectValue placeholder="All formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All formats</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Sort by
                  </label>
                  <Select
                    value={`${filters.sortBy || "created_at"}-${filters.sortOrder || "desc"}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split("-");
                      handleFilterChange({
                        sortBy: sortBy as
                          | "created_at"
                          | "updated_at"
                          | "date"
                          | "title"
                          | "price"
                          | "status",
                        sortOrder: sortOrder as "asc" | "desc",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem
                          key={`${option.value}-desc`}
                          value={`${option.value}-desc`}
                        >
                          {option.label} (Newest)
                        </SelectItem>
                      ))}
                      {sortOptions.map((option) => (
                        <SelectItem
                          key={`${option.value}-asc`}
                          value={`${option.value}-asc`}
                        >
                          {option.label} (Oldest)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleFilterChange({
                      featured: filters.featured ? undefined : true,
                    })
                  }
                >
                  <Star className="h-4 w-4 mr-2" />
                  {filters.featured ? "Show All" : "Featured Only"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {pagination.total === 0
            ? "No engagements found"
            : `Showing ${Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} engagements`}
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Engagement Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((skeletonNumber) => (
            <Card key={`skeleton-engagement-${skeletonNumber}`} className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : engagements.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No engagements found</h3>
            <p className="text-muted-foreground mb-4">
              {search || getActiveFiltersCount() > 0
                ? "Try adjusting your search or filters"
                : "Get started by creating your first engagement"}
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Engagement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {engagements.map((engagement) => (
              <EngagementCard
                key={engagement.id}
                engagement={engagement}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                const showPage =
                  page === 1 ||
                  page === pagination.totalPages ||
                  (page >= pagination.page - 1 && page <= pagination.page + 1);

                if (!showPage) return null;

                if (
                  page === pagination.page - 2 ||
                  page === pagination.page + 2
                ) {
                  return (
                    <div key={page} className="px-2">
                      ...
                    </div>
                  );
                }

                return (
                  <Button
                    key={page}
                    variant={page === pagination.page ? "default" : "outline"}
                    onClick={() => setPagination({ ...pagination, page })}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Engagement Form Modal */}
      <EngagementForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        engagementId={editingEngagement?.id}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
