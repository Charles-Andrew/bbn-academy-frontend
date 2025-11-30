import { createClient } from "./client";

export type Engagement = {
  id: string;
  title: string;
  type: string;
  description: string;
  slug: string | null;
  images: string[];
  created_at: string;
  updated_at: string;
};

export async function getEngagements(type?: string) {
  const supabase = createClient();

  let query = supabase
    .from("engagements")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching engagements:", error);
    return [];
  }

  return data as Engagement[];
}

export async function getEngagementBySlug(slug: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("engagements")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching engagement by slug:", error);
    return null;
  }

  return data as Engagement;
}

export async function getEngagementTypes() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("engagements")
    .select("type");

  if (error) {
    console.error("Error fetching engagement types:", error);
    return [];
  }

  const types = [...new Set(data?.map(item => item.type) || [])];
  return types;
}