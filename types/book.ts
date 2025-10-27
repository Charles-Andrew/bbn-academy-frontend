export interface Book {
  id: string
  title: string
  description: string
  coverImage: string
  author: string
  genre: string
  publishedAt: string
  isbn?: string
  price?: number
  purchaseUrl?: string
  tags: string[]
  featured?: boolean
  content?: string // For book preview/sample
  createdAt: string
  updatedAt: string
}

export interface BookCardProps {
  book: Book
  variant?: 'default' | 'featured' | 'compact'
}

export interface BookFilterOptions {
  genre?: string
  author?: string
  tags?: string[]
  featured?: boolean
  search?: string
}