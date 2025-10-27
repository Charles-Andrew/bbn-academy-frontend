import { create } from 'zustand'
import type { ContactMessage } from '@/types/contact'

interface AdminStore {
  messages: ContactMessage[]
  selectedMessage: ContactMessage | null
  loading: boolean
  error: string | null
  filters: {
    status?: 'unread' | 'read' | 'replied'
    search?: string
    dateRange?: {
      start: string
      end: string
    }
  }
  setMessages: (messages: ContactMessage[]) => void
  setSelectedMessage: (message: ContactMessage | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<AdminStore['filters']>) => void
  updateMessageStatus: (messageId: string, status: 'unread' | 'read' | 'replied') => void
  markAllAsRead: () => void
  getUnreadCount: () => number
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  messages: [],
  selectedMessage: null,
  loading: false,
  error: null,
  filters: {},

  setMessages: (messages) => set({ messages }),
  setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),

  updateMessageStatus: (messageId, status) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === messageId ? { ...msg, status } : msg
    ),
  })),

  markAllAsRead: () => set((state) => ({
    messages: state.messages.map((msg) => ({ ...msg, status: 'read' as const })),
  })),

  getUnreadCount: () => {
    const { messages, filters } = get()
    return messages.filter((msg) => {
      const matchesStatus = !filters.status || msg.status === filters.status
      const matchesSearch = !filters.search ||
        msg.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.message.toLowerCase().includes(filters.search.toLowerCase())

      return msg.status === 'unread' && matchesStatus && matchesSearch
    }).length
  },
}))