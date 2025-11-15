import { create } from "zustand";
import type { ContactMessage } from "@/types/contact";
import type { Book } from "@/types/book";

interface AdminStore {
  // Messages
  messages: ContactMessage[];
  selectedMessage: ContactMessage | null;
  
  // Books
  books: Book[];
  selectedBook: Book | null;
  
  // Common state
  loading: boolean;
  error: string | null;
  
  // Message filters
  filters: {
    status?: "unread" | "read" | "replied";
    search?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  
  // Book filters
  bookFilters: {
    search?: string;
    genres?: string[];
    featuredStatus?: ("featured" | "non-featured")[];
  };

  // Message actions
  setMessages: (messages: ContactMessage[]) => void;
  setSelectedMessage: (message: ContactMessage | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<AdminStore["filters"]>) => void;
  updateMessageStatus: (
    messageId: string,
    status: "unread" | "read" | "replied",
  ) => void;
  markAllAsRead: () => void;
  getUnreadCount: () => number;

  // Book actions
  setBooks: (books: Book[]) => void;
  setSelectedBook: (book: Book | null) => void;
  setBookFilters: (filters: Partial<AdminStore["bookFilters"]>) => void;
  addBook: (book: Book) => void;
  updateBook: (bookId: string, updates: Partial<Book>) => void;
  removeBook: (bookId: string) => void;
  toggleBookFeatured: (bookId: string) => void;
  getFilteredBooks: () => Book[];
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  messages: [],
  selectedMessage: null,
  books: [],
  selectedBook: null,
  loading: false,
  error: null,
  filters: {},
  bookFilters: {},

  // Message actions
  setMessages: (messages) => set({ messages }),
  setSelectedMessage: (selectedMessage) => set({ selectedMessage }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  updateMessageStatus: (messageId, status) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, status } : msg,
      ),
    })),

  markAllAsRead: () =>
    set((state) => ({
      messages: state.messages.map((msg) => ({
        ...msg,
        status: "read" as const,
      })),
    })),

  getUnreadCount: () => {
    const { messages, filters } = get();
    return messages.filter((msg) => {
      const matchesStatus = !filters.status || msg.status === filters.status;
      const matchesSearch =
        !filters.search ||
        msg.full_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        msg.message.toLowerCase().includes(filters.search.toLowerCase());

      return msg.status === "unread" && matchesStatus && matchesSearch;
    }).length;
  },

  // Book actions
  setBooks: (books) => set({ books }),
  setSelectedBook: (selectedBook) => set({ selectedBook }),
  setBookFilters: (filters) =>
    set((state) => ({
      bookFilters: { ...state.bookFilters, ...filters },
    })),

  addBook: (book) =>
    set((state) => ({
      books: [book, ...state.books],
    })),

  updateBook: (bookId, updates) =>
    set((state) => ({
      books: state.books.map((book) =>
        book.id === bookId ? { ...book, ...updates } : book,
      ),
    })),

  removeBook: (bookId) =>
    set((state) => ({
      books: state.books.filter((book) => book.id !== bookId),
    })),

  toggleBookFeatured: (bookId) =>
    set((state) => ({
      books: state.books.map((book) =>
        book.id === bookId ? { ...book, featured: !book.featured } : book,
      ),
    })),

  getFilteredBooks: () => {
    const { books, bookFilters } = get();
    return books.filter((book) => {
      const matchesSearch =
        !bookFilters.search ||
        book.title.toLowerCase().includes(bookFilters.search.toLowerCase()) ||
        book.author.toLowerCase().includes(bookFilters.search.toLowerCase()) ||
        book.description.toLowerCase().includes(bookFilters.search.toLowerCase());

      const matchesGenres = 
        !bookFilters.genres || 
        bookFilters.genres.length === 0 || 
        bookFilters.genres.includes(book.genre);

      const matchesFeatured = 
        !bookFilters.featuredStatus || 
        bookFilters.featuredStatus.length === 0 ||
        (book.featured && bookFilters.featuredStatus.includes("featured")) ||
        (!book.featured && bookFilters.featuredStatus.includes("non-featured"));

      return matchesSearch && matchesGenres && matchesFeatured;
    });
  },
}));
