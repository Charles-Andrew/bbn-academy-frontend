export interface ContactMessage {
  id: string
  full_name: string
  email: string
  purpose: string
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
  attachments?: ContactAttachment[]
}

export interface ContactAttachment {
  id: string
  message_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  created_at: string
}

export interface ContactFormData {
  fullName: string
  email: string
  purpose: string
  message: string
  attachments: File[]
}

export interface ContactFormResponse {
  success: boolean
  message?: string
  data?: ContactMessage
}

export const CONTACT_PURPOSES = [
  'Book Inquiry',
  'Writing Services',
  'Collaboration',
  'Speaking Engagement',
  'Other'
] as const

export type ContactPurpose = typeof CONTACT_PURPOSES[number]