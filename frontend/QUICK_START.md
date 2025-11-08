# Quick Start Guide

Get the SEO Intelligence Platform frontend up and running in minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend API running on `http://localhost:3000` (see `/backend` directory)

## Installation Steps

### 1. Install Dependencies

```bash
cd /home/user/seo-intelligence-platform/frontend
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Zustand, React Query, and more

### 2. Configure Environment

The `.env` file is already created with default settings:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
NEXT_PUBLIC_APP_NAME=SEO Intelligence Platform
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

If your backend runs on a different port, update `NEXT_PUBLIC_API_URL` accordingly.

### 3. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000` (or the next available port if 3000 is taken).

### 4. Access the Application

Open your browser and navigate to:
- **Development**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register

## First Time Setup

### Create Your Account

1. Go to http://localhost:3000/register
2. Fill in the registration form:
   - Full Name
   - Email
   - Password (minimum 8 characters)
   - Company/Organization Name
3. Click "Create account"
4. You'll be automatically logged in and redirected to the dashboard

### Alternative: Use Existing Account

1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Sign in"

## Available Pages

Once logged in, you can access:

- **Dashboard** (`/dashboard`) - Overview of SEO metrics
- **Projects** (`/dashboard/projects`) - Manage your websites
- **Keyword Research** (`/dashboard/keywords/research`) - Find new keywords
- **Rank Tracking** (`/dashboard/keywords/tracking`) - Monitor rankings
- **SEO Audit** (`/dashboard/audit`) - Technical SEO analysis
- **Backlinks** (`/dashboard/backlinks`) - Backlink profile
- **Settings** (`/dashboard/settings`) - User preferences

## Features to Try

### 1. View Dashboard Metrics
- Check overall SEO performance
- See ranking trends
- Monitor organic traffic

### 2. Create a Project
- Click "New Project" on the Projects page
- Add your website domain
- Start tracking keywords

### 3. Research Keywords
- Use the Keyword Research tool
- Enter seed keywords
- Analyze volume, difficulty, and CPC

### 4. Track Rankings
- Monitor keyword positions over time
- See ranking changes
- View trend charts

### 5. Run SEO Audit
- Get technical SEO scores
- Review issues and recommendations
- Track improvements over time

### 6. Analyze Backlinks
- View backlink profile
- Check domain authority
- Filter by DoFollow/NoFollow

## Dark Mode

Toggle between light and dark mode using the sun/moon icon in the top-right header.

## Mobile Access

The application is fully responsive and works on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

On mobile, tap the menu icon to open the sidebar.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type check
npm run type-check
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, Next.js will automatically use the next available port (3001, 3002, etc.).

Or specify a custom port:
```bash
PORT=3001 npm run dev
```

### Backend Connection Issues

Ensure the backend API is running and accessible at the URL specified in `.env`:
```bash
# Test backend connection
curl http://localhost:3000/api/v1/health
```

### Module Not Found Errors

Clear cache and reinstall:
```bash
rm -rf node_modules .next
npm install
```

### TypeScript Errors

Run type checking to see all errors:
```bash
npm run type-check
```

### Build Errors

Ensure all environment variables are set and try a clean build:
```bash
rm -rf .next
npm run build
```

## What's Included

### ✅ Core Features
- Authentication (Login/Register)
- JWT token management
- Dashboard with metrics
- Project management
- Keyword research & tracking
- SEO audit viewer
- Backlink explorer
- User settings

### ✅ UI Components
- 15+ shadcn/ui components
- Responsive sidebar navigation
- Header with user menu
- Breadcrumb navigation
- Line & bar charts
- Data tables
- Cards and badges

### ✅ State Management
- Zustand for client state
- React Query for server state
- Persistent auth state
- Theme preferences

### ✅ Developer Experience
- TypeScript strict mode
- ESLint configuration
- Auto-formatting setup
- Hot reload
- Fast refresh

## Next Steps

1. **Customize Branding**: Update logo and colors in `components/layout/sidebar.tsx` and `tailwind.config.ts`
2. **Add More Pages**: Create new pages in the `app/(dashboard)/dashboard/` directory
3. **Extend API**: Add new endpoints in `lib/api/index.ts`
4. **Create Components**: Build custom components in `components/`
5. **Configure Theme**: Modify color scheme in `app/globals.css`

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query)
- [Zustand](https://zustand-demo.pmnd.rs)

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the component code for usage examples
3. Open a GitHub issue for bugs or feature requests

Happy coding! 🚀
