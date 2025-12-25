"use client";

import { Calendar, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

import { toast } from "sonner";
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
import type { Engagement, EngagementType } from "@/types/engagement";
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

const sortOptions = [
  { value: "desc", label: "Newest" },
  { value: "asc", label: "Oldest" },
];

export function EngagementList({ className }: EngagementListProps) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [allEngagements, setAllEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EngagementType | "all">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEngagement, setEditingEngagement] = useState<Engagement | null>(
    null,
  );

  // Debounced search value
  const debouncedSearch = useDebounce(search, 300);

  // Filter and sort engagements on the client side
  const filteredEngagements = useMemo(() => {
    let filtered = allEngagements;

    // Apply search filter
    if (debouncedSearch) {
      filtered = filtered.filter(
        (engagement) =>
          engagement.title
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          engagement.description
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()),
      );
    }

    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(
        (engagement) => engagement.type === typeFilter,
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allEngagements, debouncedSearch, typeFilter, sortOrder]);

  // Update displayed engagements when filters change
  useEffect(() => {
    setEngagements(filteredEngagements);
  }, [filteredEngagements]);

  const fetchEngagements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/engagements?limit=1000"); // Get all engagements
      if (response.ok) {
        const data = await response.json();
        setAllEngagements(data.engagements);
      } else {
        toast.error("Failed to fetch engagements");
      }
    } catch (error) {
      console.error("Error fetching engagements:", error);
      toast.error("Failed to fetch engagements");
    } finally {
      setLoading(false);
    }
  }, []);

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
    setAllEngagements(allEngagements.filter((e) => e.id !== id));
  };

  const handleUpdate = (updatedEngagement: Engagement) => {
    setAllEngagements(
      allEngagements.map((e) =>
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

  return (
    <div className={`space-y-6 px-2 ${className || ""}`}>
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
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search engagements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <div suppressHydrationWarning>
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as EngagementType | "all")
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {engagementTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div suppressHydrationWarning>
          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value as "asc" | "desc")}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        {filteredEngagements.length === 0
          ? "No engagements found"
          : `Showing ${filteredEngagements.length} engagement${filteredEngagements.length !== 1 ? "s" : ""}`}
      </div>

      {/* Engagement Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((skeletonNumber) => (
            <Card
              key={`skeleton-engagement-${skeletonNumber}`}
              className="animate-pulse"
            >
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
              {search || typeFilter !== "all"
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
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
