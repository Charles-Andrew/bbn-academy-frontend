export type LogLevel = "user_action" | "error" | "success" | "system";
export type LogFilterValue = LogLevel | "all";

export interface LogEntry {
  id?: string;
  type: LogLevel;
  action: string;
  details: Record<string, any>;
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export interface LogContext {
  user_id?: string;
  user_email?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface LogOptions {
  includeUserAgent?: boolean;
  includeIpAddress?: boolean;
}

export interface CreateLogData {
  type: LogLevel;
  action: string;
  details: Record<string, any>;
  context?: LogContext;
}

export interface LogFilters {
  type?: LogLevel;
  action?: string;
  user_email?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}
