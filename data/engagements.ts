import type { Engagement, EngagementFilters } from "@/types/engagement";
import engagementsData from "./data.json";

export const engagements: Engagement[] =
  engagementsData.engagements as Engagement[];

const hasFutureDate = (
  engagement: Engagement,
  now: Date,
): engagement is Engagement & { date: string } =>
  Boolean(engagement.date && new Date(engagement.date) > now);

export const getUpcomingEngagements = () => {
  const now = new Date();
  return engagements
    .filter((engagement): engagement is Engagement & { date: string } =>
      hasFutureDate(engagement, now),
    )
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
};

export const getEngagementsByType = (type: string) =>
  engagements.filter((engagement) => engagement.type === type);

export const getVirtualEngagements = () =>
  engagements.filter((engagement) => engagement.is_virtual);

export const getInPersonEngagements = () =>
  engagements.filter((engagement) => !engagement.is_virtual);

export const getEngagementById = (id: string) =>
  engagements.find((engagement) => engagement.id === id);

export const searchEngagements = (query: string) =>
  engagements.filter(
    (engagement) =>
      engagement.title.toLowerCase().includes(query.toLowerCase()) ||
      engagement.description.toLowerCase().includes(query.toLowerCase()),
  );

export const filterEngagements = (filters: EngagementFilters) => {
  return engagements.filter((engagement) => {
    if (filters.type && engagement.type !== filters.type) return false;
    if (filters.upcoming !== undefined) {
      const now = new Date();
      const isUpcoming = engagement.date && new Date(engagement.date) > now;
      if (filters.upcoming !== isUpcoming) return false;
    }
    if (
      filters.virtual !== undefined &&
      engagement.is_virtual !== filters.virtual
    )
      return false;
    return true;
  });
};

export const getEngagementTypes = () => {
  const types = new Set(engagements.map((engagement) => engagement.type));
  return Array.from(types) as Engagement["type"][];
};
