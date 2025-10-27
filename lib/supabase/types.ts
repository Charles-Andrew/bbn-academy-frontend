export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          purpose: string
          message: string
          status: 'unread' | 'read' | 'replied'
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          purpose: string
          message: string
          status?: 'unread' | 'read' | 'replied'
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          purpose?: string
          message?: string
          status?: 'unread' | 'read' | 'replied'
          created_at?: string
        }
      }
      contact_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}