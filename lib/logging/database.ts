import { createClient } from "@/lib/supabase/server";
import type { CreateLogData, LogEntry, LogFilters } from "./types";

export class LogDatabase {
  async createLog(logData: CreateLogData): Promise<string | null> {
    try {
      const supabase = await createClient();

      // Handle user_id validation - only set if it's a valid UUID format
      let userId: string | undefined = logData.context?.user_id;
      if (userId && (userId === "admin_user" || userId === "anonymous")) {
        // Convert non-UUID user identifiers to undefined since they're not real users
        userId = undefined;
      }

      const { data, error } = await supabase
        .from("application_logs")
        .insert({
          type: logData.type,
          action: logData.action,
          details: logData.details,
          user_id: userId,
          user_email: logData.context?.user_email,
          ip_address: logData.context?.ip_address,
          user_agent: logData.context?.user_agent,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Failed to create log entry:", error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error("Error creating log entry:", error);
      return null;
    }
  }

  async getLogs(
    filters: LogFilters = {},
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("application_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.type) {
        query = query.eq("type", filters.type);
      }
      if (filters.action) {
        query = query.ilike("action", `%${filters.action}%`);
      }
      if (filters.user_email) {
        query = query.ilike("user_email", `%${filters.user_email}%`);
      }
      if (filters.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte("created_at", filters.date_to);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(
          filters.offset,
          filters.offset + (filters.limit || 50) - 1,
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Failed to fetch logs:", error);
        return { logs: [], total: 0 };
      }

      return {
        logs: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error("Error fetching logs:", error);
      return { logs: [], total: 0 };
    }
  }

  async deleteLogs(olderThanDays: number): Promise<number> {
    try {
      const supabase = await createClient();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from("application_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString())
        .select("id");

      if (error) {
        console.error("Failed to delete old logs:", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error("Error deleting old logs:", error);
      return 0;
    }
  }

  async getLogStats(): Promise<{
    total: number;
    userActions: number;
    errors: number;
    successes: number;
    system: number;
  }> {
    try {
      const supabase = await createClient();

      // Get counts by type
      const { count: total, error: totalError } = await supabase
        .from("application_logs")
        .select("*", { count: "exact", head: true });

      const { count: userActions, error: userActionsError } = await supabase
        .from("application_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "user_action");

      const { count: errors, error: errorsError } = await supabase
        .from("application_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "error");

      const { count: successes, error: successesError } = await supabase
        .from("application_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "success");

      const { count: system, error: systemError } = await supabase
        .from("application_logs")
        .select("*", { count: "exact", head: true })
        .eq("type", "system");

      if (
        totalError ||
        userActionsError ||
        errorsError ||
        successesError ||
        systemError
      ) {
        console.error("Failed to get log stats");
        return {
          total: 0,
          userActions: 0,
          errors: 0,
          successes: 0,
          system: 0,
        };
      }

      return {
        total: total || 0,
        userActions: userActions || 0,
        errors: errors || 0,
        successes: successes || 0,
        system: system || 0,
      };
    } catch (error) {
      console.error("Error getting log stats:", error);
      return {
        total: 0,
        userActions: 0,
        errors: 0,
        successes: 0,
        system: 0,
      };
    }
  }
}
