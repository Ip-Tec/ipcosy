# IPCosy Project Documentation

## 1. Project Overview
**IPCosy** is a secure, privacy-focused anonymous messaging platform that allows users to communicate without revealing their personal details unless they choose to. It leverages standard Google authentication to simplify access while maintaining a layer of anonymity through generated usernames (aliases).

### Key Features
- **Anonymous Messaging:** Users communicate via aliases. Real identities are protected.
- **Ephemeral Data:** Messages are automatically deleted after 72 hours.
- **Group Chats:** Premium users can create group chats. Users can join via unique codes.
- **Device & Location Insights (Premium):** Premium users can see metadata about the sender (Device, OS, City, Country) without revealing their IP or exact identity.
- **Secure Architecture:** Built with privacy and security as core tenets.

## 2. Technology Stack

### Frontend & Backend
- **Framework:** [Next.js 16](https://nextjs.org/) (React 19) - providing server-side rendering and API routes.
- **Language:** TypeScript - for type safety and developer productivity.
- **Styling:** Tailwind CSS - utility-first CSS framework.

### Database & DRM
- **Database:** MySQL
- **ORM:** [Prisma](https://www.prisma.io/) - for type-safe database access and schema management.
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) - handling Google authentication and session management.

### Real-time Communication
- **WebSockets:** `@ipcosy/ip-socket` - A custom or wrapper library for handling real-time socket connections for chat.

### Infrastructure & Deployment
- **Monorepo Structure:** Managed with `pnpm` workspaces for efficient dependency handling across packages (`apps/web`, `packages/db`, etc.).
- **Uploads:** `uploadthing` for handling media uploads.

## 3. Database Schema (Key Models)

### User
Stores user identity, profile information, and custom IPCosy fields.
- `username`: The anonymous alias.
- `fingerprint`: Browser fingerprint for security.
- `isPremium`, `isAdmin`: Role and subscription status flags.
- Relations to `ChatParticipant`, `Message`, `Notification`.

### Message
Stores chat content and metadata.
- `content`, `fileUrl`: The actual message data.
- `deviceType`, `city`, `jsonBrowserFingerprint`: Metadata visible to Premium users or Admins.
- Links to `User` (sender) and `Chat`.

### Chat & ChatParticipant
Manages 1-on-1 and Group conversations.
- `isGroup`: Flag to differentiate chat types.
- `joinCode`: Unique code for joining groups.
- `ParticipantRole`: Defines roles like `OWNER`, `ADMIN`, `MEMBER`.

## 4. Key Workflows

### Authentication
1. User signs in via Google.
2. If new, a unique `username` (alias) and `referralCode` are generated.
3. Access is granted.

### Messaging
1. Users can initiate chats via public links or joining groups.
2. Messages are sent via WebSockets for real-time delivery.
3. Messages persist in the database for 72 hours (policy) before cleanup (implementation details separate).

### Subscription (Premium)
- Premium users unlock features like Group Creation and advanced Sender Analytics (Device/Location info).

## 5. Directory Structure
- `apps/web`: The main Next.js application.
  - `src/app`: App Router pages and API routes.
  - `src/components`: Reusable UI components.
  - `src/lib`: Utility functions (auth, constants).
  - `src/types`: Type definitions.
- `packages/db`: Shared Prisma database package.

## 6. Future Roadmap
- Enhanced Admin Panel features.
- More robust payment integration (Paystack).
- Mobile application development.
