# BBN Academy Frontend

A modern educational platform website built with Next.js 16, TypeScript, and Supabase. Features a hidden admin dashboard for content management and real-time updates.

## 🚀 Features

### **Public Features**
- **Responsive Design**: Mobile-first design with dark/light theme support
- **Book Catalog**: Dynamic book listings with detailed views and search capabilities
- **Blog System**: Full-featured blog with tags, categories, and rich content
- **Contact Form**: Interactive contact form with file upload support
- **Product Showcase**: Product catalog with filtering and search
- **Engagements Calendar**: Events and workshops management
- **SEO Optimized**: Comprehensive SEO with dynamic metadata and sitemaps

### **Admin Features**
- **Hidden Admin Dashboard**: Real-time dashboard at `/admin/dashboard`
- **Content Management**: Manage books, blogs, products, and engagements
- **Message Management**: Handle contact messages and file attachments
- **Live Statistics**: Real-time updates via Supabase subscriptions
- **File Upload**: Image and document management with cloud storage

### **Technical Highlights**
- **Hybrid Rendering**: SSG/SSR/CSR strategy for optimal performance
- **Modern Stack**: Next.js 16, React 19, TypeScript 5
- **Tailwind CSS v4**: Latest version with CSS-based configuration
- **Component Library**: shadcn/ui with New York style
- **Type Safety**: Comprehensive TypeScript with strict mode
- **Performance**: Optimized for Core Web Vitals and SEO

## 🛠️ Technology Stack

### **Core Framework**
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript 5** - Type-safe development

### **Styling & UI**
- **Tailwind CSS v4** - Modern CSS framework with @theme configuration
- **shadcn/ui** - Component library with Radix UI primitives
- **Framer Motion** - Animation library
- **next-themes** - Theme switching (dark/light mode)

### **Backend & Database**
- **Supabase** - Backend as a Service (PostgreSQL + Storage + Auth)
- **Zustand** - State management
- **React Hook Form + Zod** - Form handling and validation

### **Development Tools**
- **Biome** - Linting and formatting (2-space indentation)
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing for Tailwind v4

## 📁 Project Structure

```
bbn-academy-frontend/
├── app/                                    # Next.js App Router
│   ├── (marketing)/                         # Public marketing pages
│   │   ├── about/                          # About page (SSG)
│   │   ├── books/                          # Book catalog (SSR)
│   │   ├── blogs/                          # Blog posts (SSR)
│   │   ├── contact/                        # Contact page (SSG + CSR)
│   │   ├── engagements/                    # Events page
│   │   ├── products/                       # Product catalog (SSR)
│   │   └── services/                       # Services page (SSG)
│   ├── admin/                              # Admin dashboard (CSR)
│   ├── api/                                # API routes
│   ├── login/                              # Authentication
│   ├── globals.css                         # Global styles + Tailwind config
│   ├── layout.tsx                          # Root layout
│   └── page.tsx                            # Homepage (SSG)
├── components/                             # React components
│   ├── admin/                              # Admin-specific components
│   ├── auth/                               # Authentication components
│   ├── contact/                            # Contact form components
│   ├── layout/                             # Layout components
│   ├── providers/                          # Context providers
│   └── ui/                                 # shadcn/ui components
├── lib/                                    # Utilities and configs
│   ├── supabase/                           # Supabase integration
│   ├── validations.ts                      # Zod schemas
│   └── utils.ts                            # Utility functions
├── types/                                  # TypeScript definitions
├── data/                                   # Data management
├── hooks/                                  # Custom React hooks
├── store/                                  # Zustand state management
└── public/                                 # Static assets
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+
- pnpm (recommended) or npm/yarn
- Supabase project (for backend functionality)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd bbn-academy/bbn-academy-frontend
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Environment Setup**

   Copy the example environment file:
```bash
cp .env.local.example .env.local
```

   Configure your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Development**

Start the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

**Admin Dashboard**: Navigate to `/admin/dashboard` (not publicly linked)

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start development server with hot reload

# Code Quality
pnpm lint            # Run Biome linter (checks code quality and formatting)
pnpm format          # Format code with Biome
pnpm type-check      # TypeScript type checking

# Production
pnpm build           # Build for production
pnpm start           # Start production server
```

## 🎨 Tailwind CSS v4 Configuration

This project uses the latest Tailwind CSS v4 with modern CSS-based configuration:

### **Key Features**
- **No tailwind.config.js**: Configuration moved to CSS files using `@theme` blocks
- **PostCSS Plugin**: Uses `@tailwindcss/postcss` plugin
- **CSS Custom Properties**: Design tokens defined in `app/globals.css`
- **Modern Color Space**: Uses OKLCH for better color control
- **Custom Variants**: Defined with `@custom-variant` directive

### **Configuration Structure**
```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Design tokens as CSS custom properties */
  --color-primary: oklch(var(--primary));
  --font-sans: system-ui;
  --radius-md: 0.375rem;
}
```

## 🏗️ Architecture

### **Hybrid Rendering Strategy**

#### **Static Site Generation (SSG)**
- Homepage, About, Services, Contact pages
- 50-70% faster page loads
- Perfect SEO scores
- Reduced server costs

#### **Server-Side Rendering (SSR)**
- Book details, Product pages, Blog posts
- Dynamic content with fresh data
- `generateStaticParams()` for build-time generation
- SEO-optimized metadata

#### **Client-Side Rendering (CSR)**
- Admin dashboard
- Interactive forms
- Real-time statistics
- Rich user interactions

### **Database Schema**

The application uses Supabase PostgreSQL with the following main tables:

- **Contact Messages**: Form submissions with file attachments
- **Books**: Book catalog with metadata and cover images
- **Blog Posts**: Content management with tags and categories
- **Products**: Product catalog with inventory
- **Engagements**: Events and workshops

## 🔧 Configuration Files

### **Next.js Configuration** (`next.config.ts`)
- Optimized build settings
- Security headers
- Image optimization
- Bundle optimization

### **PostCSS Configuration** (`postcss.config.mjs`)
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### **TypeScript Configuration**
- Strict mode enabled
- Path aliases: `@/*` → project root
- React JSX transformation

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod
```

### **Environment Variables for Production**
Configure the same environment variables in your hosting platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

## 🧪 Testing

### **Current Testing Approach**
- **Type Safety**: Comprehensive TypeScript with strict mode
- **Error Boundaries**: Application-wide error handling
- **Component Testing**: Loading states and skeleton components
- **Performance Testing**: Optimized rendering strategies

### **Recommended Testing Setup**
```bash
# For production testing
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test
```

## 📊 Performance

### **Optimizations**
- **Core Web Vitals**: Optimized for LCP, FID, CLS
- **Image Optimization**: WebP/AVIF formats with lazy loading
- **Bundle Splitting**: Code splitting by routes
- **Caching Strategy**: Proper cache headers and static optimization

### **SEO Features**
- Dynamic metadata generation
- Sitemap generation for all routes
- Robots.txt configuration
- OpenGraph and social media optimization

## 🔐 Security

- **Authentication**: Supabase Auth integration
- **Admin Protection**: Role-based access control
- **Security Headers**: CSP, HSTS, XSS protection
- **Data Validation**: Zod schemas for all inputs
- **File Upload**: Secure file handling with validation

## 📝 Contributing

### **Code Standards**
- Use **PascalCase** for component names
- Follow **2-space indentation** (Biome default)
- Import organization on save
- TypeScript strict mode - no `any` types
- Semantic HTML5 elements
- Accessibility (ARIA labels, keyboard navigation)

### **Git Workflow**
- Feature branches for new development
- Descriptive commit messages
- Pull requests for code review
- Automated CI/CD checks

## 📚 Learn More

### **Documentation**
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs/v4-beta)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Biome](https://biomejs.dev)

### **Community**
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Tailwind CSS GitHub](https://github.com/tailwindlabs/tailwindcss)

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ using Next.js 16, TypeScript, and Supabase**
