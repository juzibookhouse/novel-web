# Novel Web Platform

A modern web application for novel reading and management built with SvelteKit, featuring user authentication, novel publishing, chapter management, and gift/reward system.

## 🚀 Features

### Core Functionality
- **User Management**: Registration, login, and profile management
- **Novel Publishing**: Authors can create, edit, and publish novels
- **Chapter Management**: Chapter creation, editing, and publishing workflow
- **Reading Experience**: Clean reading interface with chapter navigation
- **Comments System**: Interactive commenting on chapters
- **Gift/Reward System**: Users can send gifts to authors

### Advanced Features
- **Payment Integration**: Stripe integration for subscriptions and gifts
- **Admin Dashboard**: Comprehensive admin interface for content management
- **Email Notifications**: Automated email system for various events
- **Reading Analytics**: Track reading time and user engagement
- **Content Protection**: Copy protection and mobile version restrictions

## 🛠️ Technology Stack

- **Frontend**: SvelteKit 5.0.0
- **Styling**: TailwindCSS 4.1.4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend
- **Rich Text Editor**: Quill
- **TypeScript**: Full TypeScript support

## 📦 Project Structure

```
src/
├── routes/                 # Application routes
│   ├── admin/             # Admin dashboard
│   ├── author/            # Author-specific pages
│   ├── novel/             # Novel viewing and management
│   ├── user/              # User authentication and profiles
│   └── api/               # API endpoints
├── lib/                   # Shared utilities and components
│   ├── components/        # Reusable Svelte components
│   ├── supabaseClient.ts  # Supabase client configuration
│   └── types/             # TypeScript type definitions
└── static/                # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, pnpm, or yarn
- Supabase account
- Stripe account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd novel-web
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with the following variables:
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
```

4. Start development server
```bash
npm run dev

# or start with browser auto-open
npm run dev -- --open
```

## 📖 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript checks
- `npm run check:watch` - Run TypeScript checks in watch mode

## 🔧 API Endpoints

### Authentication & User Management
- `POST /api/user` - User registration and management
- Authentication handled via Supabase Auth

### Novel Management
- `GET /api/novels` - Fetch novels list
- `GET /api/novels/[novelId]` - Get specific novel details
- `GET /api/novels/[novelId]/chapters/[chapterId]/comments` - Chapter comments

### Payment & Gifts
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `POST /api/gift-payment-intent` - Gift payment processing
- `GET/POST /api/novels/[novelId]/chapters/[chapterId]/gifts` - Gift management

### Analytics
- `GET /api/reading_records` - Reading analytics with filtering
- `GET /api/admin/reading_records` - Admin reading analytics

## 🎯 Key Components

### Novel Components
- `NovelDetail.svelte` - Novel detail page with metadata
- `ChapterGifts.svelte` - Gift display and payment flow
- `CommentsList.svelte` - Interactive comments with navigation
- `ReceivedGifts.svelte` - Gift receiving interface

### Gift System
- `GiftSelectors.svelte` - Gift selection with pagination
- Gift types: "must", "random", "negative" with intelligent display logic

### Admin Components
- Admin dashboard for user, novel, and content management
- Reading analytics with filtering by month and type

## 🔒 Security Features

- Content copy protection
- Mobile version restrictions
- Secure payment processing
- Authentication middleware
- Input validation and sanitization

## 📊 Database Schema

The application uses Supabase with the following key tables:
- `novels` - Novel metadata and content
- `chapters` - Chapter content and publishing status
- `user_profiles` - Extended user information
- `chapter_gifts` - Gift transactions and status
- `reading_records` - User reading analytics
- `membership_plans` - Subscription plans

## 🚀 Deployment

To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

```bash
npm run build
```

## 📝 Todo List

### Completed Features
- [x] Reader subscription system
- [x] Novel creation time and word count tracking
- [x] Content copy protection
- [x] Mobile version restrictions
- [x] Contact form with admin notifications
- [x] Chapter publishing workflow
- [x] Reading analytics with filtering
- [x] Email notifications for payments and signups
- [x] Author application and approval system
- [x] Gift/reward system with Stripe integration

### In Progress
- [ ] Novel and cover styling improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software.