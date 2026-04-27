# AscendRFQ — System Architecture

## Table of Contents

- [System Overview](#system-overview)
- [High Level Architecture](#high-level-architecture)
- [Tech Stack Decisions](#tech-stack-decisions)
- [Backend Architecture](#backend-architecture)
- [Database Design](#database-design)
- [Auction Engine](#auction-engine)
- [Real-time Layer](#real-time-layer)
- [Authentication & Authorization](#authentication--authorization)
- [Background Jobs](#background-jobs)
- [API Design](#api-design)
- [Frontend Architecture](#frontend-architecture)
- [Key Design Decisions](#key-design-decisions)

---

## System Overview

AscendRFQ is a real-time logistics procurement platform built around the **British Auction** model. A buyer posts a shipment requirement (RFQ), invites suppliers to bid, and the system runs a competitive reverse auction where prices go down instead of up.

The core challenge this system solves is **last-second bid manipulation** — suppliers waiting until the final second to submit an unbeatable bid. The British Auction engine prevents this by automatically extending the auction whenever activity happens near the deadline.

---

## High Level Architecture

```
┌──────────────────────┐        ┌──────────────────────┐
│    Buyer Dashboard   │        │  Supplier Bidding App │
│    (React + Vite)    │        │    (React + Vite)     │
└──────────┬───────────┘        └──────────┬────────────┘
           │  HTTP (REST)                  │  HTTP (REST)
           │  WebSocket                    │  WebSocket
           ▼                              ▼
┌──────────────────────────────────────────────────────┐
│                  Node.js API Server                   │
│                Express 5 + Prisma ORM                 │
│                                                       │
│   ┌──────────┐  ┌─────────────┐  ┌────────────────┐  │
│   │  Routes  │→ │ Controllers │→ │    Services    │  │
│   └──────────┘  └─────────────┘  └───────┬────────┘  │
│                                          │            │
│              ┌───────────────────────────┤            │
│              ▼                           ▼            │
│   ┌─────────────────┐       ┌──────────────────────┐  │
│   │  Auction Engine │       │    Activity Logger   │  │
│   │ checkAndExtend()│       │  (every bid/event)   │  │
│   └────────┬────────┘       └──────────────────────┘  │
│            │                                           │
│            ▼                                           │
│   ┌─────────────────┐                                  │
│   │   Socket.io     │ ← emits real-time events         │
│   └─────────────────┘                                  │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
               ▼                           ▼
   ┌───────────────────┐       ┌───────────────────────┐
   │    PostgreSQL      │       │      Socket.io        │
   │  (via Prisma ORM) │       │   (per-RFQ rooms)     │
   └───────────────────┘       └───────────────────────┘
               ▲
               │
   ┌───────────────────┐
   │    node-cron      │  ← runs every minute
   │ checkExpiredAuctions│    auto-closes auctions
   └───────────────────┘
```

---

## Tech Stack Decisions

### Node.js + Express 5
Chosen for its non-blocking I/O model which handles concurrent bid submissions efficiently. Express 5 adds native async error handling, removing the need for try/catch wrappers in every route.

### PostgreSQL + Prisma ORM
PostgreSQL provides ACID transactions ensuring bid data is never corrupted even under concurrent writes. Prisma was chosen over raw SQL for:
- Type-safe database queries
- Clean schema definition with migrations
- Nested create/update operations (Bid + Quote created in one call)

### Socket.io
Handles real-time communication between the server and all connected clients. Uses room-based messaging — each RFQ has its own room (`rfqId`). Clients join only the rooms they need, keeping traffic minimal.

### node-cron
Lightweight scheduler that runs every minute to check for expired auctions. Chosen over Bull Queue for simplicity — the assignment doesn't require job retries or distributed processing.

### JWT + HTTP-only Cookies
Tokens stored in HTTP-only cookies (not localStorage) to prevent XSS attacks. Cookies are sent automatically with every request, eliminating manual token management on the frontend.

---

## Backend Architecture

### Layer Structure

```
Request → Route → Middleware → Controller → Service → Prisma → DB
                                                ↓
                                         auction.service
                                         (checkAndExtend)
                                                ↓
                                          Socket.io emit
```

### Separation of Concerns

**Routes** — Define URL patterns and attach middleware chains. No business logic.

**Controllers** — Extract data from `req`, call services, return `res`. No business logic beyond input extraction and response formatting.

**Services** — All business logic lives here. Each domain has its own service file:
- `auth.service.js` — register, login, token generation
- `rfq.service.js` — RFQ CRUD, status transitions
- `bid.service.js` — bid validation, submission, activity logging
- `auction.service.js` — extension engine, auction closure, expired auction checks
- `supplier.service.js` — invitation management, status updates
- `activitylog.service.js` — log retrieval

**Utils** — Shared infrastructure: Prisma client (`db.js`), Socket.io instance (`socket.js`)

---

## Database Design

### Design Principles

**Separation of Bid and Quote**
A `Bid` represents the competitive act (price, ranking, timestamp). A `Quote` represents the detailed submission (carrier name, individual charges, transit time, validity). They are linked 1:1 with `Quote` holding the foreign key `bidId`. Quote is a child of Bid — deleting a bid cascades to delete its quote.

**Denormalized `bidAmount`**
`bidAmount` is stored explicitly on `Bid` even though it could be computed as `freight + origin + destination`. This is a deliberate denormalization for performance — ranking queries and extension checks run on every bid submission and need instant access to the total without recalculating across three fields.

**`currentEndTime` vs `bidCloseTime`**
`bidCloseTime` is the original deadline set by the buyer — it never changes. `currentEndTime` starts equal to `bidCloseTime` but gets updated every time the auction extends. The auction engine always works against `currentEndTime`.

**ActivityLog design**
Every significant event writes to `ActivityLog` with `oldValue` and `newValue` as JSON fields. This gives a complete, queryable audit trail without needing separate tables for each event type.

### Table Relationships

```
Company ──< User ──< RFQ ──< Bid ──── Quote
                      │       │
                      │       └──< ActivityLog
                      │
                      ├──< AuctionConfig (1:1)
                      ├──< RFQSupplier
                      ├──< AuctionExtension
                      └──< Notification
```

### Key Indexes

```sql
-- Fast auction status queries (listing page)
@@index([status, currentEndTime])  on RFQ

-- Fast bid ranking queries (run on every bid)
@@index([rfqId, bidAmount, createdAt])  on Bid

-- Fast activity log queries (details page)
@@index([rfqId, createdAt])  on ActivityLog

-- Fast notification queries
@@index([userId, isRead])  on Notification

-- Prevent duplicate supplier invitations
@@unique([rfqId, supplierId])  on RFQSupplier
```

---

## Auction Engine

The auction engine (`checkAndExtend`) is the core of the system. It runs automatically as part of every bid submission — not as a separate API call.

### Flow

```
Bid saved to DB
      ↓
checkAndExtend(rfq, newBid) called internally by bid.service
      ↓
1. Get auction config from rfq.config
2. Is extension enabled? No → return early
3. Calculate trigger window start:
   triggerWindowStart = currentEndTime - (extensionWindow * 60 * 1000)
4. Was bid placed inside trigger window?
   newBid.createdAt >= triggerWindowStart? No → return early
5. Check extension trigger type:
   ┌─ BID_RECEIVED    → always extend (step 4 passing is enough)
   ├─ ANY_RANK_CHANGE → check if newBid.bidAmount < any existing bid
   └─ L1_CHANGE       → check if previous lowest bidder ≠ newBid.supplierId
6. Should we extend? No → return early
7. Calculate new end time:
   newEndTime = currentEndTime + (extensionDuration * 60 * 1000)
8. Cap at forcedCloseTime:
   cappedEndTime = min(newEndTime, forcedCloseTime)
9. cappedEndTime <= currentEndTime? No extension possible → return
10. Update RFQ.currentEndTime = cappedEndTime
11. Create AuctionExtension record
12. Create ActivityLog entry (EXTENSION_TRIGGERED)
13. Emit "auction_extended" via Socket.io to rfqId room
```

### Extension Trigger Types

| Trigger | When it Extends | Use Case |
|---|---|---|
| `BID_RECEIVED` | Any bid in window | Most permissive — extends on any activity |
| `ANY_RANK_CHANGE` | Any supplier overtakes another | Extends only when competition actually changes |
| `L1_CHANGE` | Lowest bidder changes | Most strict — extends only when top spot changes hands |

### Forced Close Enforcement

The forced close time is enforced at two levels:

1. **Extension cap** — `checkAndExtend` never sets `currentEndTime` beyond `forcedCloseTime`
2. **Bid rejection** — `bid.service` checks `now > rfq.currentEndTime` before accepting any bid
3. **Cron job** — `checkExpiredAuctions` runs every minute and force-closes any auction past `forcedCloseTime`

---

## Real-time Layer

### Room Architecture

Each active RFQ has its own Socket.io room identified by `rfqId`. Clients join on page load and leave on unmount.

```javascript
// Client joins room
socket.emit("join_rfq", rfqId);

// Client leaves room
socket.emit("leave_rfq", rfqId);
```

### Events

| Event | Emitted By | Listeners |
|---|---|---|
| `new_bid` | `bid.service` after bid created | Details page — refreshes rankings, bids, activity log |
| `auction_extended` | `auction.service.checkAndExtend` | Details + listing — updates timer and currentEndTime |
| `auction_closed` | `auction.service.closeAuction` + cron | Details + listing — shows closed state, locks bidding UI |
| `auction_force_closed` | `auction.service.forceCloseAuction` + cron | Details + listing — shows force closed state |

### Listing Page Strategy

The listing page joins all active RFQ rooms on load. When any event fires for any RFQ, it updates that specific row without refreshing the whole list.

---

## Authentication & Authorization

### Token Flow

```
Register/Login → bcryptjs hashes password → JWT signed with JWT_SECRET
→ Token stored in HTTP-only cookie (not localStorage)
→ Every request sends cookie automatically
→ auth.middleware.js verifies token → attaches decoded user to req.user
→ Controllers access req.user.userId, req.user.role, req.user.companyId
```

### Authorization Layers

**Role-level** — `authorize("BUYER")` middleware checks `req.user.role`

**Resource-level** — Services check ownership before mutating data:
```javascript
if (rfq.buyerId !== req.user.userId) throw new Error("Unauthorized");
```

### Cookie Configuration

```javascript
{
  httpOnly: true,                              // Not accessible via JS
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",                          // CSRF protection
  maxAge: 1 * 60 * 60 * 1000                  // 1 hour expiry
}
```

---

## Background Jobs

### Auction Auto-closure (node-cron)

Runs every minute via cron schedule `* * * * *`.

```
Every minute:
  1. Find all ACTIVE RFQs where forcedCloseTime <= now
     → Update status to FORCED_CLOSED
     → Emit "auction_force_closed" per RFQ

  2. Find all ACTIVE RFQs where currentEndTime <= now
     → Update status to CLOSED
     → Emit "auction_closed" per RFQ
```

This ensures auctions close automatically even if no buyer manually closes them. The 1-minute polling interval means auctions close within 60 seconds of their deadline — acceptable for this use case.

---

## API Design

### REST Conventions

- `GET` — read only, never mutates
- `POST` — creates a new resource
- `PATCH` — partial update (status change, not full replace)
- All responses follow `{ success: boolean, data/message }` format
- Errors bubble to global error handler in `app.js`

### Route Mounting Strategy

Routes are mounted with `mergeParams: true` to allow nested routes to access parent params:

```javascript
app.use("/api/rfqs/:id/bids", bidRoutes);      // bidRoutes can access :id
app.use("/api/rfqs/:id/suppliers", supplierRoutes);
```

### Error Handling

All service errors throw with a message. Controllers pass errors to `next(error)`. The global error handler in `app.js` formats and returns the response:

```javascript
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});
```

---

## Frontend Architecture

### Pages

| Page | Route | Description |
|---|---|---|
| Login | `/login` | Auth page for buyers and suppliers |
| RFQ Listing | `/rfqs` | All auctions with live status updates |
| RFQ Create | `/rfqs/new` | Form to create a new RFQ with config |
| Auction Details | `/rfqs/:id` | Live bidding page with rankings, log, timer |

### Folder Structure

```
src/
  /pages          ← full page components
  /components     ← reusable UI (BidTable, Timer, RankBadge, ActivityLog)
  /api            ← axios calls per domain (rfq.api.js, bid.api.js, auth.api.js)
  /socket         ← socket.io client setup and event handlers
  /auth           ← auth context, user state
  /hooks          ← custom hooks (useAuction, useSocket, useRankings)
```

### Real-time Strategy

On the Auction Details page, the component:
1. Joins the RFQ room on mount
2. Listens for `new_bid` → refetches rankings and bids
3. Listens for `auction_extended` → updates countdown timer
4. Listens for `auction_closed` / `auction_force_closed` → shows closed UI
5. Leaves the room on unmount

---

## Key Design Decisions

### Why not Redis for the extension job?
The assignment scope is a simplified system. Redis + Bull Queue would add operational complexity (running a separate Redis instance) without meaningful benefit at this scale. node-cron polling every minute is sufficient and keeps the stack simple.

### Why store `bidAmount` redundantly?
Ranking queries and extension checks run on every bid submission. Recalculating `freight + origin + destination` every time adds unnecessary DB computation. Storing `bidAmount` explicitly is a deliberate denormalization tradeoff — reads are faster, writes do one extra field.

### Why HTTP-only cookies over Authorization headers?
Cookies with `httpOnly: true` are not accessible via JavaScript, making them immune to XSS attacks. Bearer tokens in localStorage are a common but insecure pattern. For a B2B procurement platform, security is a priority.

### Why separate `AuctionExtension` table from `ActivityLog`?
`ActivityLog` is a general event stream — everything goes in there. `AuctionExtension` is a structured record specifically for extension events with typed fields (`oldEndTime`, `newEndTime`, `triggerType`). Having both means you can query "show me all extensions for this RFQ" efficiently without parsing JSON from the activity log.

### Why `DRAFT` → `ACTIVE` status transition?
Buyers need time to configure the RFQ and invite suppliers before bidding opens. `DRAFT` status allows setup without accepting bids. The buyer explicitly activates the auction when ready. This mirrors real procurement workflows.