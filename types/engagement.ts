export interface Engagement {
  id: string;
  title: string;
  type: "workshop" | "speaking" | "consultation";
  description: string;
  date: string | null;
  duration: string;
  price: number | null;
  max_attendees: number | null;
  location: string | null;
  is_virtual: boolean;
  booking_url: string | null;
  created_at: string;
}

export interface EngagementFilters {
  type?: string;
  upcoming?: boolean;
  virtual?: boolean;
}
