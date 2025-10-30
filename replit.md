# Overview

Loopedia is a web application for sharing and managing RC505mk2 loop station presets. Users can create, share, and discover detailed effect configurations for the RC505mk2 hardware. The application has been simplified from a full social platform to focus on personal preset management with optional URL-based sharing.

The application is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL (via Neon serverless) for data persistence.

# Recent Changes

**October 30, 2025** - Feature Reduction Refactoring
- Removed all social features: likes, bookmarks, comments, follows, notifications
- Deleted 9 database tables: bookmarks, comments, contacts, contact_replies, likes, notifications, user_loopers, user_settings, user_follows
- Simplified users table: removed avatarUrl, country, birthday fields
- Removed frontend pages: notifications, contact, admin-panel, landing, user-profile, search
- Changed preset list page to "My Presets" (マイプリセット) - displays only authenticated user's presets
- Simplified settings page to password change only
- Retained core features: preset CRUD, tags, admin-granted badge system, URL-based preset sharing
- Database migration completed successfully via `npm run db:push`

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Uses `wouter` for lightweight client-side routing instead of React Router.

**State Management**: Relies on TanStack Query (React Query) for server state management rather than Redux or Context API. This provides built-in caching, background refetching, and optimistic updates.

**UI Components**: Built with Radix UI primitives and styled with Tailwind CSS. Uses a custom shadcn/ui-inspired component library for consistent design patterns.

**Form Handling**: Uses react-hook-form with zod for schema validation.

**Key Design Decisions**:
- Mobile-first responsive design with dedicated hooks for device detection (`useIsMobile`)
- Progressive Web App (PWA) support with service worker for offline capabilities
- Component-based architecture with separation of concerns (pages, components, lib, hooks)

## Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js.

**Database ORM**: Drizzle ORM for type-safe database queries and schema management.

**Authentication**: Passport.js with local strategy for username/password authentication. Sessions are managed with express-session using an in-memory store (MemoryStore) in the current implementation.

**Password Security**: Uses Node.js crypto module with scrypt for password hashing with salt. Includes backward compatibility for legacy plaintext passwords.

**API Design**: RESTful API endpoints with consistent error handling and response formats.

**Key Design Decisions**:
- Middleware-based request processing with CORS support for cross-origin requests
- Session-based authentication with credentials included in requests
- File uploads handled via static file serving from `public/uploads`
- Centralized error handling and logging

## Database Design

**Provider**: Neon serverless PostgreSQL accessed via `@neondatabase/serverless`.

**Schema Management**: Drizzle Kit for migrations and schema synchronization.

**Core Tables**:
- `users`: User accounts with authentication credentials and profile information
- `presets`: RC505mk2 preset configurations linked to users
- `effects`: Individual effect settings for each preset (position, type, parameters)
- `tags`: Categorization system for presets
- `preset_tags`: Many-to-many relationship between presets and tags
- `titles`: Badge/achievement system (admin-manageable)
- `user_titles`: User achievement assignments

**Key Design Decisions**:
- Serial primary keys for simplicity
- Timestamp tracking for creation dates
- JSON/text storage for complex effect parameters
- Foreign key constraints for data integrity
- Removed social features (likes, bookmarks, comments, follows, notifications) in recent simplification

## Effect Parameter System

**Complex Configuration**: The application manages detailed RC505mk2 effect parameters including:
- Multiple effect types (LPF, BPF, HPF, PHASER, FLANGER, SYNTH, VOCODER, etc.)
- Musical note values represented as both text and images
- Numeric ranges, select options, and combined input types
- Effect positioning across INPUT and TRACK channels

**Key Design Decisions**:
- Parameter configurations defined in `parameter-config.ts` with type-safe definitions
- Support for image-based note selection using SVG/PNG assets
- Dynamic parameter rendering based on effect type
- Separation of effect options for different FX groups (INPUT_FX, TRACK_FX, etc.)

## File Structure

- `/client`: React frontend application
  - `/src/pages`: Route components
  - `/src/components`: Reusable UI components
  - `/src/lib`: Utilities, API clients, effect definitions
  - `/src/hooks`: Custom React hooks
  - `/public`: Static assets including PWA manifests and service workers
- `/server`: Express backend
  - `index.ts`: Application entry point
  - `routes.ts`: API endpoint definitions
  - `auth.ts`: Authentication configuration
  - `storage.ts`: Database access layer
  - `db.ts`: Database connection setup
- `/shared`: Types and schemas shared between frontend and backend
  - `schema.ts`: Drizzle schema definitions and Zod validation schemas

# External Dependencies

## Database

- **Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database accessed via WebSocket connections
- **Drizzle ORM**: Type-safe ORM for database operations and schema management

## Authentication

- **Passport.js**: Authentication middleware with local strategy
- **express-session**: Session management for maintaining user login state
- **connect-pg-simple**: PostgreSQL session store (configured but currently using MemoryStore)

## Frontend Libraries

- **TanStack Query**: Server state management with caching and synchronization
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight routing library
- **react-hook-form**: Form state management
- **Zod**: Schema validation
- **date-fns**: Date formatting and manipulation

## Build Tools

- **Vite**: Fast development server and build tool
- **esbuild**: JavaScript bundler for production builds
- **TypeScript**: Type system for both frontend and backend

## Image Assets

The application uses custom SVG and PNG images for musical note representations, stored in `/public/images/notes/` and `/public/images/notes_svg/` directories. These are referenced dynamically based on parameter configurations.