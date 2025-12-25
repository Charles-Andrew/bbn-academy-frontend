"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Save, Star } from "lucide-react";
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
  date: z.string().optional(),
  featured: z.boolean(),
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
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<EngagementFormData>({
    resolver: zodResolver(engagementFormSchema),
    defaultValues: {
      title: "",
      type: "workshop",
      description: "",
      date: undefined,
      featured: false,
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
              date: engagement.date
                ? new Date(engagement.date).toISOString().slice(0, 10)
                : undefined,
              featured: engagement.featured || false,
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
        date: undefined,
        featured: false,
        images: [],
      });
      setFiles([]);
    }
  }, [engagementId, isOpen, onClose, form]);

  const onSubmit = async (data: EngagementFormData) => {
    setIsSubmitting(true);
    let uploadToastId: string | number | undefined;

    try {
      const url = engagementId
        ? `/api/admin/engagements/${engagementId}`
        : "/api/admin/engagements";

      const method = engagementId ? "PUT" : "POST";

      // Show uploading toast for files
      if (files.length > 0) {
        uploadToastId = toast.loading(
          `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`,
        );
      }

      // Create FormData for submission
      const formData = new FormData();

      // Add all form fields
      formData.append("title", data.title);
      formData.append("slug", data.slug || "");
      formData.append("type", data.type);
      formData.append("description", data.description);
      formData.append("date", data.date || "");
      formData.append("featured", data.featured ? "true" : "false");
      formData.append("images", JSON.stringify(data.images || []));

      // Add new files
      files.forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (response.ok) {
        await response.json();

        // Update toast to show success
        if (uploadToastId && files.length > 0) {
          toast.success(
            `${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully!`,
            {
              id: uploadToastId,
            },
          );
        }

        toast.success(
          engagementId
            ? "Engagement updated successfully"
            : "Engagement created successfully",
        );

        // Reset form and files after successful submission
        form.reset({
          title: "",
          type: "workshop",
          description: "",
          date: undefined,
          featured: false,
          images: [],
        });
        setFiles([]);

        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();

        // Dismiss upload toast on error
        if (uploadToastId) {
          toast.dismiss(uploadToastId);
        }

        toast.error(errorData.error || "Failed to save engagement");
      }
    } catch (error) {
      console.error("Error saving engagement:", error);

      // Dismiss any upload toast on error
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }

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
          <div
            className="flex flex-col"
            style={{ height: "calc(90vh - 8rem)" }}
          >
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6 h-full flex flex-col"
                >
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
                                  <SelectItem
                                    key={type.value}
                                    value={type.value}
                                  >
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

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Engagement Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  placeholder="Select engagement date"
                                  className="max-w-xs"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Date when the engagement takes place
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Featured Engagement</FormLabel>
                              <FormControl>
                                <div className="flex items-center space-x-4">
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(!field.value)}
                                    className={`
                                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                                        ${field.value ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"}
                                      `}
                                  >
                                    <span
                                      className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                        ${field.value ? "translate-x-6" : "translate-x-1"}
                                      `}
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => field.onChange(!field.value)}
                                    className="flex items-center space-x-3 group cursor-pointer"
                                  >
                                    {field.value && (
                                      <Star className="h-4 w-4 text-primary fill-current" />
                                    )}
                                    <span className="text-sm font-medium group-hover:text-primary transition-colors">
                                      {field.value
                                        ? "Featured"
                                        : "Not Featured"}
                                    </span>
                                  </button>
                                </div>
                              </FormControl>
                              <FormDescription>
                                Display this engagement prominently on the
                                website homepage
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
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
                                files={files}
                                onFilesChange={setFiles}
                                maxImages={10}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Fixed Footer with Buttons - Inside Form */}
                  <div className="flex-shrink-0 bg-background border-t p-6 pt-4 mt-auto">
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
                  </div>
                </form>
              </Form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
