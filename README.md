# CampusSync

A comprehensive student collaboration and learning platform designed to help campus communities organize, collaborate, and succeed together.

## Features

- **Dashboard**: Central hub displaying key information and quick access to all features
- **Profile Management**: Customize your profile and institutional details
- **Flash Cards**: Create, study, and master subjects with spaced repetition learning
- **Task Management**: Organize and track academic and personal tasks
- **Event Calendar**: Browse, create, and manage campus events
- **Resource Library**: Access and share educational resources with peers
- **Group Collaboration**: Form study groups and collaborate with classmates
- **Peer Network**: Connect with other students and build your academic community
- **Authentication**: Secure login with Google OAuth integration

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Backend/Database**: Supabase
- **Authentication**: Google OAuth 2.0
- **Language**: JavaScript (ES modules)

## Prerequisites

Before running the project, ensure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Git (for version control)
- A Supabase account and project
- Google OAuth credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CampusSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create or update the `.env` file in the project root with your configuration:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

## Getting Started

### Development Server

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port specified by Vite).

### Build for Production

Create an optimized production build:
```bash
npm run build
```

### Preview Production Build

Preview the production build locally:
```bash
npm run preview
```

### Code Quality

Run ESLint to check code quality:
```bash
npm run lint
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppLayout.jsx    # Main application layout wrapper
│   ├── ProtectedRoute.jsx # Route protection for authenticated users
│   └── Sidebar.jsx      # Navigation sidebar
├── context/            # React Context for state management
│   ├── AuthContext.jsx  # Authentication state
│   └── AppDataContext.jsx # Application data state
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication hook
│   └── useAppData.js   # Application data hook
├── pages/              # Page components
│   ├── AuthPage.jsx
│   ├── DashboardPage.jsx
│   ├── ProfilePage.jsx
│   ├── InstitutionalDetailsPage.jsx
│   ├── FlashCardsPage.jsx
│   ├── TasksPage.jsx
│   ├── EventsPage.jsx
│   ├── ResourcesPage.jsx
│   ├── GroupsPage.jsx
│   ├── PeersPage.jsx
│   └── NotFoundPage.jsx
├── services/           # API and external service integrations
│   ├── authService.js  # Authentication service
│   ├── dbService.js    # Database operations
│   ├── flashCardsService.js # Flash card functionality
│   ├── geminiService.js # Gemini AI integration
│   ├── rateLimiter.js  # API rate limiting
│   ├── spacedRepetition.js # Spaced repetition algorithm
│   └── supabase.js     # Supabase client initialization
├── utils/              # Utility functions
│   └── taskHelpers.js  # Task-related helper functions
├── App.jsx            # Main app component
├── main.jsx           # Application entry point
└── index.css          # Global styles
```

## Configuration Files

- **vite.config.js**: Vite build configuration
- **tailwind.config.js**: Tailwind CSS customization
- **postcss.config.js**: PostCSS configuration for Tailwind
- **eslint.config.js**: ESLint rules and configuration
- **supabase_master_schema.sql**: Database schema definition

## Authentication

CampusSync uses Google OAuth for secure authentication. Users must:

1. Sign in with their Google account
2. Grant necessary permissions
3. Complete their institutional profile
4. Access all protected features

Protected routes automatically redirect unauthenticated users to the authentication page.

## API Integration

The application integrates with:

- **Supabase**: Real-time database and authentication
- **Google OAuth**: User authentication
- **Gemini AI**: AI-powered features (if configured)

## Performance Optimizations

- Lazy loading of page components for faster initial load
- Code splitting via Vite and React Router
- Rate limiting for API requests
- Spaced repetition algorithm for efficient learning

## Browser Support

CampusSync works best on modern browsers that support:

- ES2020+ JavaScript
- CSS Grid and Flexbox
- Async/await

## Contributing

When contributing to this project:

1. Follow the existing code structure
2. Run `npm run lint` before committing
3. Maintain the component-based architecture
4. Update documentation as needed

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port.

### Environment Variables Not Loading
Ensure your `.env` file is in the project root and restart the development server.

### Authentication Issues
Verify that:
- Google OAuth credentials are correctly configured
- Supabase URL and keys are valid
- OAuth redirect URIs are configured in Google Cloud Console

## License

[Add your license information here]

## Support

For issues and feature requests, please open an issue in the repository.

---

**Last Updated**: April 2026
