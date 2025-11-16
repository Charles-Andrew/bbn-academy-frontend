import { create } from "zustand";
import type { BlogPost, BlogTag } from "@/types/blog";
import type { Book } from "@/types/book";
import type { ContactMessage } from "@/types/contact";

interface AdminStore {
  // Messages
  messages: ContactMessage[];
  selectedMessage: ContactMessage | null;

  // Books
  books: Book[];
  selectedBook: Book | null;

  // Blog Posts
  blogPosts: BlogPost[];
  selectedBlogPost: BlogPost | null;
  blogPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  // Blog Tags
  blogTags: BlogTag[];

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

  // Blog filters
  blogFilters: {
    search?: string;
    status?: "published" | "draft" | "all";
    author?: string;
    tags?: string[];
    featured?: boolean;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
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

  // Blog actions
  setBlogPosts: (posts: BlogPost[]) => void;
  setSelectedBlogPost: (post: BlogPost | null) => void;
  setBlogPagination: (pagination: AdminStore["blogPagination"]) => void;
  setBlogFilters: (filters: Partial<AdminStore["blogFilters"]>) => void;
  setBlogTags: (tags: BlogTag[]) => void;
  addBlogPost: (post: BlogPost) => void;
  updateBlogPost: (postId: string, updates: Partial<BlogPost>) => void;
  removeBlogPost: (postId: string) => void;
  toggleBlogPostPublished: (postId: string) => void;
  refreshBlogPosts: () => Promise<void>;
  getFilteredBlogPosts: () => BlogPost[];
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  // Initial state
  messages: [],
  selectedMessage: null,
  books: [],
  selectedBook: null,
  blogPosts: [],
  selectedBlogPost: null,
  blogPagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  blogTags: [],
  loading: false,
  error: null,
  filters: {},
  bookFilters: {},
  blogFilters: {},

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
        book.description
          .toLowerCase()
          .includes(bookFilters.search.toLowerCase());

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

  // Blog actions
  setBlogPosts: (blogPosts) => set({ blogPosts }),
  setSelectedBlogPost: (selectedBlogPost) => set({ selectedBlogPost }),
  setBlogPagination: (blogPagination) => set({ blogPagination }),
  setBlogFilters: (filters) =>
    set((state) => ({
      blogFilters: { ...state.blogFilters, ...filters },
    })),
  setBlogTags: (blogTags) => set({ blogTags }),

  addBlogPost: (post) =>
    set((state) => ({
      blogPosts: [post, ...state.blogPosts],
    })),

  updateBlogPost: (postId, updates) =>
    set((state) => ({
      blogPosts: state.blogPosts.map((post) =>
        post.id === postId ? { ...post, ...updates } : post,
      ),
      selectedBlogPost:
        state.selectedBlogPost?.id === postId
          ? { ...state.selectedBlogPost, ...updates }
          : state.selectedBlogPost,
    })),

  removeBlogPost: (postId) =>
    set((state) => ({
      blogPosts: state.blogPosts.filter((post) => post.id !== postId),
      selectedBlogPost:
        state.selectedBlogPost?.id === postId ? null : state.selectedBlogPost,
    })),

  toggleBlogPostPublished: (postId) =>
    set((state) => ({
      blogPosts: state.blogPosts.map((post) =>
        post.id === postId
          ? { ...post, is_published: !post.is_published }
          : post,
      ),
      selectedBlogPost:
        state.selectedBlogPost?.id === postId
          ? {
              ...state.selectedBlogPost,
              is_published: !state.selectedBlogPost.is_published,
            }
          : state.selectedBlogPost,
    })),

  refreshBlogPosts: async () => {
    try {
      set({ loading: true, error: null });
      const { blogFilters, blogPagination } = get();

      const searchParams = new URLSearchParams();
      searchParams.set("page", blogPagination.page.toString());
      searchParams.set("limit", blogPagination.limit.toString());

      if (blogFilters.search) searchParams.set("search", blogFilters.search);
      if (blogFilters.status && blogFilters.status !== "all") {
        searchParams.set("status", blogFilters.status);
      }
      if (blogFilters.author) searchParams.set("author", blogFilters.author);
      if (blogFilters.tags && blogFilters.tags.length > 0) {
        searchParams.set("tags", blogFilters.tags.join(","));
      }
      if (blogFilters.dateFrom)
        searchParams.set("dateFrom", blogFilters.dateFrom);
      if (blogFilters.dateTo) searchParams.set("dateTo", blogFilters.dateTo);
      if (blogFilters.sortBy) searchParams.set("sortBy", blogFilters.sortBy);
      if (blogFilters.sortOrder)
        searchParams.set("sortOrder", blogFilters.sortOrder);

      const response = await fetch(
        `/api/admin/blogs?${searchParams.toString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch blog posts");

      const data = await response.json();
      set({
        blogPosts: data.posts,
        blogPagination: data.pagination,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to refresh blog posts",
        loading: false,
      });
    }
  },

  getFilteredBlogPosts: () => {
    const { blogPosts, blogFilters } = get();
    return blogPosts.filter((post) => {
      const matchesSearch =
        !blogFilters.search ||
        post.title.toLowerCase().includes(blogFilters.search.toLowerCase()) ||
        post.excerpt
          ?.toLowerCase()
          .includes(blogFilters.search.toLowerCase()) ||
        post.content.toLowerCase().includes(blogFilters.search.toLowerCase());

      const matchesStatus =
        !blogFilters.status ||
        blogFilters.status === "all" ||
        (blogFilters.status === "published" && post.is_published) ||
        (blogFilters.status === "draft" && !post.is_published);

      const matchesAuthor =
        !blogFilters.author || post.author_id === blogFilters.author;

      const matchesTags =
        !blogFilters.tags ||
        blogFilters.tags.length === 0 ||
        blogFilters.tags.some((tag) => post.tags?.includes(tag));

      const matchesFeatured = true; // Always match since featured field doesn't exist

      const matchesDateFrom =
        !blogFilters.dateFrom ||
        new Date(post.created_at) >= new Date(blogFilters.dateFrom);

      const matchesDateTo =
        !blogFilters.dateTo ||
        new Date(post.created_at) <= new Date(blogFilters.dateTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAuthor &&
        matchesTags &&
        matchesFeatured &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  },
}));
