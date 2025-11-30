"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import type { EngagementType } from "@/types/engagement";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-lg sm:!max-w-xl md:!max-w-2xl lg:!max-w-4xl xl:!max-w-5xl max-h-[90vh] p-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="bg-background border-b p-6 pb-4">
          <DialogHeader className="pb-0">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {engagementId ? "Edit Engagement" : "Create New Engagement"}
            </DialogTitle>
          </DialogHeader>
        </div>

        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col" style={{ height: 'calc(90vh - 8rem)' }}>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
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
                                      <div className="flex items-center gap-3">
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
                </form>
              </Form>
            </div>

            {/* Fixed Footer with Buttons */}
            <div className="flex-shrink-0 bg-background border-t p-6 pt-4">
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
                  onClick={form.handleSubmit(form.handleSubmit)}
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
