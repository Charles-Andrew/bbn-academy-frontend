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
  publishedAt: z.string().optional(),
  isbn: z.string().optional(),
  price: z.number().positive("Price must be positive").optional().nullable(),
  purchaseUrl: z.string().url("Purchase URL must be valid").optional().or(z.literal("")),
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

// Export type inference
export type ContactFormData = z.infer<typeof contactFormSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type MessageStatusData = z.infer<typeof messageStatusSchema>;
export type BookData = z.infer<typeof bookSchema>;
export type ServiceData = z.infer<typeof serviceSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
