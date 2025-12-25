import { z } from "zod";
import { CONTACT_PURPOSES } from "@/types/contact";

// Contact form validation schema
export const contactFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(254, "Email address is too long"),
  purpose: z.enum(CONTACT_PURPOSES, {
    message: "Please select a valid purpose",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message cannot exceed 2000 characters"),
  attachments: z
    .array(z.instanceof(File))
    .max(5, "You can upload a maximum of 5 files")
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) return true;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      return totalSize <= 10 * 1024 * 1024; // 10MB total
    }, "Total file size cannot exceed 10MB")
    .refine((files) => {
      if (!files || files.length === 0) return true;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
      ];
      return files.every((file) => allowedTypes.includes(file.type));
    }, "Only images (JPEG, PNG, GIF, WebP), documents (PDF, Word), and text files are allowed"),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB per file
      "File size cannot exceed 5MB",
    )
    .refine((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "text/csv",
      ];
      return allowedTypes.includes(file.type);
    }, "File type not supported"),
});

// Message status update schema (for admin)
export const messageStatusSchema = z.object({
  status: z.enum(["unread", "read", "replied"]),
  id: z.string().uuid("Invalid message ID"),
});

// Book validation schema (for future CMS integration)
export const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  author: z.string().min(1, "Author is required"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  genre: z.string().optional(),
  publishedAt: z.string().nullable().optional(),
  isbn: z.string().optional(),
  price: z.number().positive("Price must be positive").optional().nullable(),
  purchaseUrl: z
    .string()
    .url("Purchase URL must be valid")
    .optional()
    .or(z.literal("")),
  tags: z.array(z.string()).max(10, "Too many tags").default([]),
  featured: z.boolean().default(false),
  content: z.string().optional(),
});

// Service validation schema
export const serviceSchema = z.object({
  title: z
    .string()
    .min(1, "Service title is required")
    .max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().optional(),
  duration: z.string().optional(),
  features: z.array(z.string()).min(1, "At least one feature is required"),
  featured: z.boolean().default(false),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  offset: z.coerce.number().min(0).optional(),
});

// Blog post validation schema
export const blogPostSchema = z.object({
  title: z
    .string()
    .min(1, "Blog title is required")
    .max(200, "Blog title cannot exceed 200 characters"),
  slug: z
    .string()
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .optional(),
  excerpt: z
    .string()
    .max(500, "Excerpt cannot exceed 500 characters")
    .optional(),
  content: z
    .string()
    .min(10, "Blog content must be at least 10 characters")
    .max(50000, "Content cannot exceed 50,000 characters"),

  authorId: z.string().uuid("Invalid author ID").optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z
    .string()
    .optional()
    .transform((val) => {
      // Allow empty string for drafts
      if (!val || val.trim() === "") {
        return undefined;
      }
      // Validate date format for published posts
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return undefined; // Silently handle invalid dates
      }
      return val;
    })
    .or(z.literal(undefined)),
  readingTime: z
    .number()
    .min(1, "Reading time must be at least 1 minute")
    .max(999, "Reading time cannot exceed 999 minutes")
    .optional(),
  featured: z.boolean().default(false),
  seoTitle: z
    .string()
    .max(300, "SEO title cannot exceed 300 characters")
    .optional(),
  seoDescription: z
    .string()
    .max(500, "SEO description cannot exceed 500 characters")
    .optional(),
  tags: z
    .array(z.string())
    .max(10, "Cannot have more than 10 tags")
    .default([]),
});

// Blog tag validation schema
export const blogTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9\s-]+$/,
      "Tag name can only contain letters, numbers, spaces, and hyphens",
    ),
  slug: z
    .string()
    .min(1, "Tag slug is required")
    .max(50, "Tag slug cannot exceed 50 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Tag slug must contain only lowercase letters, numbers, and hyphens",
    ),
  description: z
    .string()
    .max(200, "Tag description cannot exceed 200 characters")
    .optional(),
  color: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Color must be a valid hex color",
    )
    .optional(),
});

// Blog filter validation schema
export const blogFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["published", "draft", "all"]).default("all"),
  author: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  featured: z.boolean().optional(),
  sortBy: z.enum(["created_at", "published_at", "title"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Blog image upload validation schema
export const blogImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB
      "Image size cannot exceed 5MB",
    )
    .refine((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      return allowedTypes.includes(file.type);
    }, "Only JPEG, PNG, GIF, and WebP images are allowed"),
  alt: z.string().max(200, "Alt text cannot exceed 200 characters").optional(),
});

// Enhanced blog media upload validation schema (supports images and videos)
export const blogMediaUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .min(1, "At least one file must be provided")
    .max(10, "Cannot upload more than 10 files at once")
    .refine((files) => {
      // Check each file for appropriate size limits
      for (const file of files) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (isImage && file.size > 10 * 1024 * 1024) {
          return false; // Images must be ≤ 10MB
        }
        if (isVideo && file.size > 25 * 1024 * 1024) {
          return false; // Videos must be ≤ 25MB
        }
      }
      return true;
    }, "Images cannot exceed 10MB and videos cannot exceed 25MB")
    .refine((files) => {
      const allowedTypes = [
        // Image formats
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Video formats
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      return files.every((file) => allowedTypes.includes(file.type));
    }, "Only images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM, OGG, MOV) are allowed"),
  postId: z.string().uuid("Invalid blog post ID"),
  altTexts: z
    .array(z.string().max(200, "Alt text cannot exceed 200 characters"))
    .optional(),
  captions: z
    .array(z.string().max(500, "Caption cannot exceed 500 characters"))
    .optional(),
});

// Single media file validation for metadata updates
export const blogMediaMetadataSchema = z.object({
  id: z.string().uuid("Invalid media ID"),
  alt_text: z
    .string()
    .max(200, "Alt text cannot exceed 200 characters")
    .optional(),
  caption: z
    .string()
    .max(500, "Caption cannot exceed 500 characters")
    .optional(),
  is_featured: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

// Media reordering schema
export const blogMediaReorderSchema = z.object({
  postId: z.string().uuid("Invalid blog post ID"),
  mediaIds: z
    .array(z.string().uuid())
    .min(1, "At least one media ID is required"),
});

// Media deletion schema
export const blogMediaDeleteSchema = z.object({
  id: z.string().uuid("Invalid media ID"),
  postId: z.string().uuid("Invalid blog post ID"),
});

// Blog pagination with filters schema
export const blogPaginationSchema = paginationSchema.extend({
  filters: blogFiltersSchema.optional(),
});

// Blog bulk actions schema
export const blogBulkActionSchema = z.object({
  action: z.enum(["publish", "unpublish", "delete", "add_tags", "remove_tags"]),
  postIds: z
    .array(z.string().uuid())
    .min(1, "At least one post must be selected"),
  tags: z.array(z.string()).optional(), // For tag-related bulk actions
});

// Engagement validation schema
export const engagementSchema = z.object({
  title: z
    .string()
    .min(1, "Engagement title is required")
    .max(200, "Engagement title cannot exceed 200 characters"),
  slug: z
    .string()
    .max(200, "Slug cannot exceed 200 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .nullable()
    .optional(),
  type: z.enum(
    [
      "webinar",
      "workshop",
      "training",
      "coaching",
      "consulting",
      "speaking",
      "course",
      "event",
    ],
    {
      message: "Please select a valid engagement type",
    },
  ),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description cannot exceed 2000 characters"),
  date: z
    .string()
    .optional()
    .transform((val) => {
      // Allow empty string for optional dates
      if (!val || val.trim() === "") {
        return undefined;
      }
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return undefined; // Silently handle invalid dates
      }
      return val;
    })
    .or(z.literal(undefined)),
  featured: z.boolean().default(false),
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(10, "Cannot have more than 10 images")
    .default([]),
});

// Engagement filters validation schema
export const engagementFiltersSchema = z.object({
  search: z.string().optional(),
  type: z
    .enum([
      "webinar",
      "workshop",
      "training",
      "coaching",
      "consulting",
      "speaking",
      "course",
      "event",
    ])
    .optional(),
  sortBy: z.enum(["created_at", "updated_at", "title"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Engagement media upload validation schema (supports images and videos)
export const engagementImageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "File size cannot exceed 10MB",
    )
    .refine((file) => {
      const allowedTypes = [
        // Image formats
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        // Video formats
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
      ];
      return allowedTypes.includes(file.type);
    }, "Only images (JPEG, PNG, GIF, WebP, SVG) and videos (MP4, WebM, OGG, MOV) are allowed"),
  alt: z.string().max(200, "Alt text cannot exceed 200 characters").optional(),
});

// Engagement pagination with filters schema
export const engagementPaginationSchema = paginationSchema.extend({
  filters: engagementFiltersSchema.optional(),
});

// Engagement bulk actions schema
export const engagementBulkActionSchema = z.object({
  action: z.enum([
    "delete",
    "feature",
    "unfeature",
    "update_status",
    "add_tags",
    "remove_tags",
  ]),
  engagementIds: z
    .array(z.string().uuid())
    .min(1, "At least one engagement must be selected"),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).optional(), // For status update action
  tags: z.array(z.string()).optional(), // For tag-related bulk actions
});

// Engagement status update schema
export const engagementStatusSchema = z.object({
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]),
  id: z.string().uuid("Invalid engagement ID"),
});

// Export type inference
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type MessageStatusData = z.infer<typeof messageStatusSchema>;
export type BookData = z.infer<typeof bookSchema>;
export type ServiceData = z.infer<typeof serviceSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type BlogPostFormData = z.infer<typeof blogPostSchema>;

// Form-specific type that matches the transformed schema output
export type BlogPostForm = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  authorId?: string;
  isPublished: boolean;
  publishedAt?: string;
  readingTime?: number;
  tags: string[];
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
};
export type BlogTagFormData = z.infer<typeof blogTagSchema>;
export type BlogFiltersData = z.infer<typeof blogFiltersSchema>;
export type BlogImageUploadData = z.infer<typeof blogImageUploadSchema>;
export type BlogMediaUploadData = z.infer<typeof blogMediaUploadSchema>;
export type BlogMediaMetadataData = z.infer<typeof blogMediaMetadataSchema>;
export type BlogMediaReorderData = z.infer<typeof blogMediaReorderSchema>;
export type BlogMediaDeleteData = z.infer<typeof blogMediaDeleteSchema>;
export type BlogPaginationData = z.infer<typeof blogPaginationSchema>;
export type BlogBulkActionData = z.infer<typeof blogBulkActionSchema>;
export type EngagementFormData = z.infer<typeof engagementSchema>;
export type EngagementFiltersData = z.infer<typeof engagementFiltersSchema>;
export type EngagementImageUploadData = z.infer<
  typeof engagementImageUploadSchema
>;
export type EngagementPaginationData = z.infer<
  typeof engagementPaginationSchema
>;
export type EngagementBulkActionData = z.infer<
  typeof engagementBulkActionSchema
>;
export type EngagementStatusData = z.infer<typeof engagementStatusSchema>;
