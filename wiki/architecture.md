# Architecture

## Stack

- `TypeScript + Next.js 16 + App Router`
- `Tailwind CSS` with lightweight `shadcn/ui`-style primitives in `src/components/ui`
- `@tanstack/react-query` for client-side query and mutation orchestration
- `@samchon/shopping-api` as the backend SDK
- `Playwright` for browser-level verification

## Environment

- API host is configured through `NEXT_PUBLIC_SHOPPING_API_HOST`
- Channel bootstrap is configured through `NEXT_PUBLIC_SHOPPING_CHANNEL_CODE`
- Frontend-only simulation is configured through `NEXT_PUBLIC_SHOPPING_API_SIMULATE` or `SHOPPING_API_SIMULATE`
- Defaults are documented in [.env.example](/d:/github/samchon/shopping-frontend/.env.example:1)

## Layering

The app keeps SDK-specific behavior in the server adapter layer so the UI does not depend on raw SDK DTOs.

- `src/server/shopping/*`
  - owns SDK calls, customer session bootstrapping, cookie refresh, and error translation
  - maps SDK payloads into normalized frontend view models
- `src/lib/shopping/types.ts`
  - defines normalized shapes consumed by the UI
- `src/lib/shopping/hooks.ts`
  - exposes UI-facing queries and mutations against internal `/api/*` routes
- `src/components/*`
  - renders product, cart, order, and session flows without importing SDK types

## Routes

- `/`
  - catalog with search, sort, section/category filters, and pagination controls
- `/products/[id]`
  - sale detail, snapshot history, SKU-aware unit selection, and add-to-cart flow
- `/cart`
  - cart snapshot review, quantity updates, delete, and order draft creation
- `/orders`
  - order timeline and status summaries
- `/orders/[id]`
  - identity verification, shipping address entry, and publish flow

## Notable Choices

- Customer sessions are created automatically on first API use and stored in HTTP-only cookies.
- Order detail does not call `orders.publish.able` before citizen verification, because the backend returns `403` for non-citizens.
- Snapshot history uses summary data only. The summary endpoint does not expose timestamps, so the UI says that the timestamp is unavailable instead of inventing one.
- Payment publishing uses a generated prototype vendor UID internally. The UI does not expose backend-only payment vendor details as a user-facing control.
- `Suspense` wraps the catalog page because `useSearchParams()` is used in a client component under the App Router.
- The frontend test program runs in a deterministic SDK-boundary simulation mode so Playwright and README screenshots do not depend on backend uptime or random simulator payloads.
- Local Playwright was added as a dev dependency because browser verification is part of done-ness for this project.
