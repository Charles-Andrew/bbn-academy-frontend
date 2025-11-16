export interface Engagement {
  id: string;
  title: string;
  slug: string;
  type: EngagementType;
  description: string;
  content?: string | null;
  images: string[];
  date: string | null;
  duration: string;
  price: number | null;
  max_attendees: number | null;
  location: string | null;
  is_virtual: boolean;
  is_featured: boolean;
  booking_url: string | null;
  status: EngagementStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type EngagementType =
  | "webinar"
  | "workshop"
  | "training"
  | "coaching"
  | "consulting"
  | "speaking"
  | "course"
  | "event";

export type EngagementStatus =
  | "upcoming"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface EngagementFilters {
  type?: EngagementType;
  status?: EngagementStatus;
  upcoming?: boolean;
  virtual?: boolean;
  featured?: boolean;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "created_at" | "updated_at" | "date" | "title" | "price" | "status";
  sortOrder?: "asc" | "desc";
}

export interface CreateEngagementData {
  title: string;
  type: EngagementType;
  description: string;
  content?: string;
  images?: string[];
  date?: string | null;
  duration: string;
  price?: number | null;
  max_attendees?: number | null;
  location?: string | null;
  is_virtual?: boolean;
  is_featured?: boolean;
  booking_url?: string | null;
  status?: EngagementStatus;
  tags?: string[];
}

export interface UpdateEngagementData extends Partial<CreateEngagementData> {
  id: string;
  slug?: string;
}

export interface EngagementFormData extends CreateEngagementData {
  id?: string;
  slug?: string;
}

export interface EngagementStats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  featured: number;
  byType: Record<EngagementType, number>;
  byStatus: Record<EngagementStatus, number>;
}

export interface EngagementListResponse {
  engagements: Engagement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: EngagementFilters;
}

// For image upload handling
export interface EngagementImageUpload {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  isUploading?: boolean;
  error?: string;
}
