# 📚 Classic Reads

A modern, responsive web application for browsing and discovering classic literature from Project Gutenberg's vast collection of over 70,000 free books.

![Classic Reads](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue)

## ✨ Features

### 🏠 **Beautiful Homepage**
- Hero section with compelling book discovery message
- Featured popular books carousel
- Browse by interest categories
- Responsive design optimized for all devices

### 📖 **Comprehensive Book Browsing**
- Browse 70,000+ free classic books
- Advanced filtering by language, subject, copyright status
- Sort by popularity, title (A-Z, Z-A)
- Server-side pagination for optimal performance
- Real-time search with debounced queries

### 🔍 **Powerful Search**
- Full-text search across titles, authors, and subjects
- Dedicated search page with suggestions
- Popular search terms and search tips
- Instant results with comprehensive book information

### 📚 **Detailed Book Pages**
- Complete book information including authors, subjects, translators
- Multiple download formats (EPUB, PDF, HTML, Plain Text)
- Author information with birth/death years
- Related books by the same author
- Copyright status and download statistics

### 🎨 **Modern UI/UX**
- Clean, book-inspired design with warm color palette
- Skeleton loading states for smooth user experience
- Custom 404 page with helpful navigation options
- Accessible design following WCAG guidelines
- Mobile-first responsive layout

## 🛠️ Technology Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom shadcn/ui components
- **API:** Project Gutenberg via Gutendx API
- **Icons:** Lucide React
- **Deployment:** Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd classic-reads
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file with:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── books/                    # Books listing and details
│   │   ├── [id]/                 # Individual book pages
│   │   └── _components/          # Book-related components
│   ├── search/                   # Search functionality
│   │   └── _components/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   ├── loading.tsx               # Global loading UI
│   ├── not-found.tsx             # 404 page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # Reusable UI components
│   └── layout/                   # Layout components
├── lib/
│   ├── gutendx.ts               # API client functions
│   └── utils.ts                 # Utility functions
└── hooks/                       # Custom React hooks
```

## 🌐 API Integration

The app integrates with the [Gutendx API](https://gutendex.com), which provides access to Project Gutenberg's collection:

- **No authentication required**
- **Rate limiting:** Respectful usage (10 requests/minute recommended)
- **Data format:** JSON responses
- **Caching:** 30-day persistent cache via Supabase for search/suggestions; SWR headers for CDN

### Key Endpoints Used

- `/books` - List books with filters and pagination
- `/books/{id}` - Get specific book details
 - App routes: `/api/gx/search` (cached proxy), `/api/gx/suggest` (cached suggestions)

### Supabase Cache Tables

Run these SQL statements in Supabase SQL editor:

```sql
create table if not exists public.books_cache (
  cache_key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists books_cache_expires_idx on public.books_cache (expires_at);

create table if not exists public.suggest_cache (
  cache_key text primary key,
  value jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists suggest_cache_expires_idx on public.suggest_cache (expires_at);
```

## 🎯 Key Features Implementation

### Server-Side Rendering (SSR)
- Homepage with popular books fetched at build time
- Book detail pages with dynamic metadata
- Search results rendered on the server for SEO

### Advanced Filtering
- Multiple language selection
- Subject/topic filtering
- Copyright status filtering
- Sort by popularity or alphabetical

### Performance Optimizations
- Server Components for initial data loading
- Skeleton loading states
- Optimized images with Next.js Image component
- Automatic code splitting

### Responsive Design
- Mobile-first approach
- Breakpoint-aware layouts
- Touch-friendly interface
- Optimized for screens from 320px to 4K

## 🎨 Design System

### Color Palette
- **Primary:** Warm orange (#f97316) - book-inspired
- **Secondary:** Neutral grays for text and backgrounds
- **Accent:** Complementary blues for interactive elements

### Typography
- **Headings:** Clean, readable fonts optimized for screens
- **Body:** Sans-serif for optimal readability
- **Code:** Monospace for technical content

### Components
- Consistent button styles and sizes
- Card-based layouts for content organization
- Badge system for categories and metadata
- Input controls with proper focus states

## 📱 Mobile Experience

- **Responsive grid layouts** that adapt to screen size
- **Touch-optimized buttons** and interactive elements
- **Collapsible navigation** for mobile devices
- **Optimized search interface** for mobile typing
- **Fast loading** with minimal data usage

## 🔧 Development Guidelines

### Code Quality
- TypeScript for type safety
- ESLint for consistent code formatting
- Component composition for reusability
- Proper error boundaries and loading states

### Performance
- Server Components for data fetching
- Client Components only when necessary
- Optimized bundle size with code splitting
- Efficient API caching strategies

### Accessibility
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- Sufficient color contrast ratios

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Configure environment variables** (if any)
3. **Deploy automatically** on git push

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Project Gutenberg** for providing free access to classic literature
- **Gutendx API** for the excellent API service
- **Next.js team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for the beautiful UI components

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Happy Reading! 📖** Discover the timeless classics that have shaped literature and continue to inspire readers worldwide.
