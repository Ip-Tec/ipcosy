# IPCosy — The Anonymous Social Media Platform

**Powered by Real-Time WebSockets**

IPCosy is a modern, anonymous social media platform designed for real conversations without the pressure of identity. Users can send messages, respond, chat in real-time, and share files — all without revealing who they are.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 + Tailwind + React Query |
| **Hosting** | Vercel |
| **Real-Time Engine** | `ip-socket` (Custom WebSocket Library) |
| **Database** | TiDB Cloud |
| **Storage** | TiDB blobs / Cloudinary |
| **Ops** | pnpm monorepo |

## Project Structure

- `apps/web`: Next.js frontend application.
- `apps/server`: WebSocket server (future).
- `packages/ip-socket`: Custom WebSocket library.
- `packages/ui`: Shared UI components.

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run the development server**:
   ```bash
   pnpm --filter web dev
   # or
   pnpm -r dev
   ```

## Key Features

- **100% Anonymous Interaction**: No names, no profile pictures.
- **Real-Time Chat**: Two-way chat, group threads, reactions.
- **Typing Indicators**: Powered by `ip-socket`.
- **File Sharing**: Anonymous uploads.
- **Anti-Spam**: Rate limiting and device fingerprinting.
