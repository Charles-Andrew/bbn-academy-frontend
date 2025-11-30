import type { Engagement, EngagementFilters } from "@/types/engagement";
import { getEngagements, getEngagementTypes as getDbEngagementTypes } from "@/lib/supabase/engagements";

// Cache for client-side calls
let cachedEngagements: Engagement[] | null = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAllEngagements(type?: string): Promise<Engagement[]> {
  // For server-side calls, always fetch fresh data
  if (typeof window === 'undefined') {
    return await getEngagements(type);
  }

  // For client-side calls, use cache
  const now = Date.now();
  if (cachedEngagements && (now - lastFetch) < CACHE_DURATION) {
    return type
      ? cachedEngagements.filter(engagement => engagement.type === type)
      : cachedEngagements;
  }

  const engagements = await getEngagements(type);
  if (!type) {
    cachedEngagements = engagements;
    lastFetch = now;
  }
  return engagements;
}

export const getUpcomingEngagements = async () => {
  // Since we don't have date information, return all engagements sorted by creation date
  const engagements = await getAllEngagements();
  return engagements;
};

export const getEngagementsByType = async (type: string) => {
  return await getAllEngagements(type);
};

export const getVirtualEngagements = async () => {
  // We don't have is_virtual field, so return empty array
  return [];
};

export const getInPersonEngagements = async () => {
  // We don't have is_virtual field, so return all engagements
  return await getAllEngagements();
};

export const getEngagementById = async (id: string) => {
  const engagements = await getAllEngagements();
  return engagements.find((engagement) => engagement.id === id) || null;
};

export const searchEngagements = async (query: string) => {
  const engagements = await getAllEngagements();
  const lowercaseQuery = query.toLowerCase();
  return engagements.filter(
    (engagement) =>
      engagement.title.toLowerCase().includes(lowercaseQuery) ||
      engagement.description.toLowerCase().includes(lowercaseQuery)
  );
};

export const filterEngagements = async (filters: EngagementFilters) => {
  const engagements = await getAllEngagements();
  return engagements.filter((engagement) => {
    if (filters.type && engagement.type !== filters.type) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!engagement.title.toLowerCase().includes(searchLower) &&
          !engagement.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });
};

export const getEngagementTypes = async () => {
  return await getDbEngagementTypes();
};
