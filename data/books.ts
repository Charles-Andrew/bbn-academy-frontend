import type { Book } from "@/types/book";

export const sampleBooks: Book[] = [
  {
    id: "1",
    title: "The Digital Renaissance",
    description:
      "A fascinating exploration of how technology is reshaping human creativity and culture in the 21st century.",
    coverImage:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Technology & Culture",
    publishedAt: "2024-01-15",
    isbn: "978-0123456789",
    price: 24.99,
    purchaseUrl: "https://example.com/buy/digital-renaissance",
    tags: ["technology", "culture", "digital", "creativity"],
    featured: true,
    content:
      "In this groundbreaking book, Sarah Chen explores the intersection of technology and human creativity...",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    title: "Echoes of Tomorrow",
    description:
      "A thought-provoking science fiction novel that challenges our understanding of time, consciousness, and what it means to be human.",
    coverImage:
      "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Science Fiction",
    publishedAt: "2023-11-20",
    isbn: "978-0123456790",
    price: 19.99,
    purchaseUrl: "https://example.com/buy/echoes-tomorrow",
    tags: ["science fiction", "future", "consciousness", "philosophy"],
    featured: true,
    content:
      "Set in the year 2157, Echoes of Tomorrow follows Dr. Maya Patel as she discovers a way to communicate with her future self...",
    createdAt: "2023-11-20T00:00:00Z",
    updatedAt: "2023-11-20T00:00:00Z",
  },
  {
    id: "3",
    title: "The Art of Mindful Living",
    description:
      "A practical guide to finding peace and purpose in our chaotic modern world through ancient wisdom and contemporary science.",
    coverImage:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Self-Help & Philosophy",
    publishedAt: "2023-08-10",
    isbn: "978-0123456791",
    price: 22.5,
    purchaseUrl: "https://example.com/buy/mindful-living",
    tags: ["mindfulness", "philosophy", "self-help", "wellness"],
    featured: false,
    content:
      "Drawing from both Eastern philosophy and Western psychology, this book offers a comprehensive approach to mindful living...",
    createdAt: "2023-08-10T00:00:00Z",
    updatedAt: "2023-08-10T00:00:00Z",
  },
  {
    id: "4",
    title: "Code of Life",
    description:
      "Understanding the biological and computational principles that govern life itself, from DNA to artificial intelligence.",
    coverImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Science & Technology",
    publishedAt: "2023-05-30",
    isbn: "978-0123456792",
    price: 28.99,
    purchaseUrl: "https://example.com/buy/code-of-life",
    tags: ["biology", "computing", "ai", "genetics"],
    featured: false,
    content:
      "Life itself can be understood as a form of information processing, where DNA is the original programming language...",
    createdAt: "2023-05-30T00:00:00Z",
    updatedAt: "2023-05-30T00:00:00Z",
  },
  {
    id: "5",
    title: "Stories of the Silent",
    description:
      "A collection of short stories that give voice to those often unheard, exploring themes of marginalization, resilience, and hope.",
    coverImage:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Literary Fiction",
    publishedAt: "2024-02-28",
    isbn: "978-0123456793",
    price: 17.99,
    purchaseUrl: "https://example.com/buy/stories-silent",
    tags: ["short stories", "literary", "social justice", "hope"],
    featured: true,
    content:
      "Each story in this collection is a window into lives that often remain invisible to mainstream society...",
    createdAt: "2024-02-28T00:00:00Z",
    updatedAt: "2024-02-28T00:00:00Z",
  },
  {
    id: "6",
    title: "The Last Library",
    description:
      "In a post-digital world, one woman discovers the last physical library and becomes the keeper of humanity's collective memory.",
    coverImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=center",
    author: "Sarah Chen",
    genre: "Dystopian Fiction",
    publishedAt: "2022-12-15",
    isbn: "978-0123456794",
    price: 21.99,
    purchaseUrl: "https://example.com/buy/last-library",
    tags: ["dystopian", "books", "memory", "future"],
    featured: false,
    content:
      "The year is 2089. All books have been digitized, then destroyed. Or so humanity thought...",
    createdAt: "2022-12-15T00:00:00Z",
    updatedAt: "2022-12-15T00:00:00Z",
  },
];

export const getFeaturedBooks = () =>
  sampleBooks.filter((book) => book.featured);
export const getBooksByGenre = (genre: string) =>
  sampleBooks.filter((book) => book.genre === genre);
export const searchBooks = (query: string) =>
  sampleBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.description.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())),
  );
export const getBookById = (id: string) =>
  sampleBooks.find((book) => book.id === id);
export const getBooksByTag = (tag: string) =>
  sampleBooks.filter((book) =>
    book.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
export const getBookSlugs = () => sampleBooks.map((book) => book.id);
