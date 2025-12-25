export interface Engagement {
  id: string;
  title: string;
  slug: string | null;
  type: string;
  description: string;
  images: string[];
  date: string | null;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export type EngagementType = string;

export interface EngagementFilters {
  type?: EngagementType;
  search?: string;
  sortBy?: "created_at" | "updated_at" | "title";
  sortOrder?: "asc" | "desc";
}

export interface CreateEngagementData {
  title: string;
  type: EngagementType;
  description: string;
  images?: string[];
  date?: string;
  featured?: boolean;
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
  byType: Record<EngagementType, number>;
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
