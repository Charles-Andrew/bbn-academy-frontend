"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, FileText, Loader2, MapPin, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { EngagementStatus, EngagementType } from "@/types/engagement";

// Create schema that matches the interface
const engagementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  type: z.enum([
    "webinar",
    "workshop",
    "training",
    "coaching",
    "consulting",
    "speaking",
    "course",
    "event",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  content: z.string().optional(),
  images: z.array(z.string().url()),
  date: z.string().datetime().optional().nullable(),
  duration: z.string().min(1, "Duration is required"),
  price: z.number().min(0).nullable().optional(),
  max_attendees: z.number().min(1).nullable().optional(),
  location: z.string().optional().nullable(),
  is_virtual: z.boolean(),
  is_featured: z.boolean(),
  booking_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
  tags: z.array(z.string()),
});

type EngagementFormData = z.infer<typeof engagementFormSchema>;

import { ImageManager } from "./ImageManager";

interface EngagementFormProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId?: string | null;
  onSuccess?: () => void;
}

const engagementTypes: {
  value: EngagementType;
  label: string;
  description: string;
}[] = [
  {
    value: "webinar",
    label: "Webinar",
    description: "Online presentation or workshop",
  },
  {
    value: "workshop",
    label: "Workshop",
    description: "Hands-on training session",
  },
  {
    value: "training",
    label: "Training",
    description: "Professional development program",
  },
  {
    value: "coaching",
    label: "Coaching",
    description: "One-on-one coaching session",
  },
  {
    value: "consulting",
    label: "Consulting",
    description: "Business consulting service",
  },
  {
    value: "speaking",
    label: "Speaking",
    description: "Public speaking engagement",
  },
  {
    value: "course",
    label: "Course",
    description: "Educational course or program",
  },
  { value: "event", label: "Event", description: "Special event or gathering" },
];

const engagementStatuses: {
  value: EngagementStatus;
  label: string;
  color: string;
}[] = [
  { value: "upcoming", label: "Upcoming", color: "bg-blue-100 text-blue-800" },
  { value: "ongoing", label: "Ongoing", color: "bg-green-100 text-green-800" },
  {
    value: "completed",
    label: "Completed",
    color: "bg-gray-100 text-gray-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export function EngagementForm({
  isOpen,
  onClose,
  engagementId,
  onSuccess,
}: EngagementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<EngagementFormData>({
    resolver: zodResolver(engagementFormSchema),
    defaultValues: {
      title: "",
      type: "workshop",
      description: "",
      content: "",
      images: [],
      date: null,
      duration: "",
      price: null,
      max_attendees: null,
      location: null,
      is_virtual: false,
      is_featured: false,
      booking_url: "",
      status: "upcoming",
      tags: [],
    },
  });

  // Load engagement data if editing
  useEffect(() => {
    if (engagementId && isOpen) {
      const loadEngagement = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/admin/engagements/${engagementId}`,
          );
          if (response.ok) {
            const data = await response.json();
            const engagement = data.engagement;

            form.reset({
              title: engagement.title || "",
              type: engagement.type || "workshop",
              description: engagement.description || "",
              content: engagement.content || "",
              images: engagement.images || [],
              date: engagement.date
                ? new Date(engagement.date).toISOString().slice(0, 16)
                : "",
              duration: engagement.duration || "",
              price: engagement.price,
              max_attendees: engagement.max_attendees,
              location: engagement.location || "",
              is_virtual: engagement.is_virtual || false,
              is_featured: engagement.is_featured || false,
              booking_url: engagement.booking_url || "",
              status: engagement.status || "upcoming",
              tags: engagement.tags || [],
            });
          } else {
            toast.error("Failed to load engagement");
            onClose();
          }
        } catch (error) {
          console.error("Error loading engagement:", error);
          toast.error("Failed to load engagement");
          onClose();
        } finally {
          setLoading(false);
        }
      };

      loadEngagement();
    } else if (isOpen) {
      // Reset form for new engagement
      form.reset({
        title: "",
        type: "workshop",
        description: "",
        content: "",
        images: [],
        date: null,
        duration: "",
        price: null,
        max_attendees: null,
        location: null,
        is_virtual: false,
        is_featured: false,
        booking_url: "",
        status: "upcoming",
        tags: [],
      });
    }
  }, [engagementId, isOpen, onClose, form]);

  const onSubmit = async (data: EngagementFormData) => {
    setIsSubmitting(true);
    try {
      const url = engagementId
        ? `/api/admin/engagements/${engagementId}`
        : "/api/admin/engagements";

      const method = engagementId ? "PUT" : "POST";

      // Format data for API
      const apiData = {
        ...data,
        date: data.date ? new Date(data.date).toISOString() : null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (response.ok) {
        const _result = await response.json();
        toast.success(
          engagementId
            ? "Engagement updated successfully"
            : "Engagement created successfully",
        );
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save engagement");
      }
    } catch (error) {
      console.error("Error saving engagement:", error);
      toast.error("Failed to save engagement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const _selectedType = form.watch("type");
  const isVirtual = form.watch("is_virtual");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {engagementId ? "Edit Engagement" : "Create New Engagement"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter engagement title"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-generate slug if it's empty
                              if (
                                !form.getValues("slug") ||
                                form.getValues("slug") ===
                                  generateSlug(form.getValues("title"))
                              ) {
                                form.setValue(
                                  "slug",
                                  generateSlug(e.target.value),
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engagement Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select engagement type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {engagementTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex flex-col">
                                  <span className="font-medium">
                                    {type.label}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {type.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter engagement description"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Brief description for listings and social media
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed content, agenda, or learning outcomes"
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Full content for the engagement page
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Images */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Engagement Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageManager
                            images={field.value}
                            onChange={field.onChange}
                            maxImages={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Scheduling & Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Scheduling & Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 2 hours, 3 days"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Leave empty for free engagements
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_attendees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Attendees</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Unlimited"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Location & Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location & Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              isVirtual ? "Online platform" : "Physical address"
                            }
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="is_virtual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Virtual Event
                            </FormLabel>
                            <FormDescription>Online engagement</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured
                            </FormLabel>
                            <FormDescription>
                              Highlight this engagement
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {engagementStatuses.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  <Badge className={status.color}>
                                    {status.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="booking_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/booking"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL for registration or booking
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {engagementId ? "Update" : "Create"} Engagement
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
