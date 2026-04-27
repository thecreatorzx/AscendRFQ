# 🏷️ AscendRFQ — British Auction RFQ System

A real-time Request for Quotation (RFQ) platform with British Auction–style bidding. Buyers create auctions, suppliers compete by submitting progressively lower bids, and the system automatically extends auction time when bids arrive close to the deadline.

---

## 📋 Table of Contents

- [What is a British Auction?](#what-is-a-british-auction)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Real-time Events](#real-time-events)
- [Project Structure](#project-structure)

---

## What is a British Auction?

In this system, a British Auction is a **reverse auction** where:

- A buyer creates an RFQ (Request for Quotation) for a logistics service
- Multiple suppliers submit bids (price quotes) openly
- Suppliers can continuously **lower** their prices to beat competitors
- If a bid arrives close to the auction end time, the auction is **automatically extended**
- A **Forced Close Time** acts as a hard stop — no extensions beyond this point

This prevents last-second bid manipulation and encourages fair, active competition.

---

## Features

### Core

- ✅ RFQ creation with full auction configuration
- ✅ British Auction engine with automatic time extensions
- ✅ Three extension trigger types:
  - **BID_RECEIVED** — any new bid extends the auction
  - **ANY_RANK_CHANGE** — any supplier overtaking another extends it
  - **L1_CHANGE** — only a change in the lowest bidder extends it
- ✅ Forced close time enforcement (hard cap on extensions)
- ✅ Real-time bid updates via WebSocket
- ✅ Supplier ranking (L1, L2, L3...)
- ✅ Full activity log (bids, extensions, closures)
- ✅ Auto-closure via background cron job

### Auth & Access Control

- ✅ JWT authentication via HTTP-only cookies
- ✅ Role-based access (BUYER, SUPPLIER, ADMIN)
- ✅ Resource-level ownership checks

---

## Tech Stack

| Layer           | Technology                  |
| --------------- | --------------------------- |
| Backend         | Node.js + Express           |
| Database        | PostgreSQL + Prisma ORM     |
| Real-time       | Socket.io                   |
| Auth            | JWT + bcryptjs              |
| Background Jobs | node-cron                   |
| Frontend        | React + Vite + Tailwind CSS |
| API Client      | Axios                       |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Buyer Dashboard │     │ Supplier Bidding │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         Node.js API Server              │
│         Express + Prisma                │
├─────────────────────────────────────────┤
│  Routes → Controllers → Services        │
│                                         │
│  Bid submitted                          │
│    → Save to DB                         │
│    → Log to ActivityLog                 │
│    → checkAndExtend()                   │
│    → Emit via Socket.io                 │
└──────┬──────────────────────┬───────────┘
       │                      │
       ▼                      ▼
┌─────────────┐      ┌────────────────┐
│  PostgreSQL  │      │  Socket.io     │
│  (Prisma)   │      │  (Real-time)   │
└─────────────┘      └────────────────┘
       ▲
       │
┌─────────────┐
│  node-cron  │  ← checks expired auctions every minute
└─────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ascend-rfq.git
cd ascend-rfq
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your values (see [Environment Variables](#environment-variables) below).

### 4. Set up the database

```bash
# Run migrations
npx prisma migrate dev

# Seed with test data
npm run seed
```

### 5. Start the backend server

```bash
npm run dev
```

Server runs on `http://localhost:5000`

### 6. Install and start frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Environment Variables

Create a `.env` file in the `/backend` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/auction_db"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=5000
NODE_ENV=development
```

---

## Seed Data

After running `npm run seed` you get:

| Role     | Email              | Password    |
| -------- | ------------------ | ----------- |
| BUYER    | buyer@test.com     | Password123 |
| SUPPLIER | supplier1@test.com | Password123 |
| SUPPLIER | supplier2@test.com | Password123 |
| SUPPLIER | supplier3@test.com | Password123 |
| ADMIN    | admin@test.com     | Password123 |

**4 RFQs are created:**

- RFQ 1 — ACTIVE, BID_RECEIVED trigger, 3 bids already placed
- RFQ 2 — ACTIVE, ANY_RANK_CHANGE trigger, ready for fresh bids
- RFQ 3 — DRAFT, L1_CHANGE trigger, not started
- RFQ 4 — CLOSED, full bid history available

---

## API Reference

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### RFQ Management

```
POST   /api/rfqs                    # Create RFQ (BUYER only)
GET    /api/rfqs                    # List all RFQs
GET    /api/rfqs?status=ACTIVE      # Filter by status
GET    /api/rfqs/:id                # Get RFQ details
PATCH  /api/rfqs/:id/status         # Update status (BUYER only)
GET    /api/rfqs/:id/activity       # Get activity log
```

### Auction Control

```
POST /api/rfqs/:id/close            # Close auction (BUYER only)
POST /api/rfqs/:id/force-close      # Force close (BUYER only)
```

### Bidding

```
POST /api/rfqs/:id/bids             # Submit bid (SUPPLIER only)
GET  /api/rfqs/:id/bids             # Get all bids
GET  /api/rfqs/:id/bids/rankings    # Get supplier rankings
```

### Supplier Management

```
POST   /api/rfqs/:id/suppliers                    # Invite suppliers (BUYER only)
GET    /api/rfqs/:id/suppliers                    # List suppliers
GET    /api/rfqs/:id/suppliers/:supplierId        # Get specific supplier
PATCH  /api/rfqs/:id/suppliers/:supplierId        # Accept/Reject invite
```

---

## Database Schema

### Core Tables

```
Company         → id, name, type (BUYER/SUPPLIER)
User            → id, name, email, role, companyId
RFQ             → id, name, buyerId, startTime, bidCloseTime,
                  forcedCloseTime, currentEndTime, status
AuctionConfig   → rfqId, extensionWindow, extensionDuration,
                  extensionType, extensionEnabled
RFQSupplier     → rfqId, supplierId, status (INVITED/ACCEPTED/REJECTED)
Bid             → bidId, rfqId, supplierId, bidAmount, status
Quote           → bidId, carrierName, freightCharges, originCharges,
                  destinationCharges, transitTime, validityDate
ActivityLog     → rfqId, eventType, actorId, actorType, oldValue, newValue
AuctionExtension → rfqId, triggerType, oldEndTime, newEndTime
Notification    → userId, rfqId, type, message, isRead
```

---

## Real-time Events

Clients connect via Socket.io and join an RFQ room:

```javascript
socket.emit("join_rfq", rfqId);
```

Events emitted by the server:

| Event                  | When                   | Payload                            |
| ---------------------- | ---------------------- | ---------------------------------- |
| `new_bid`              | A bid is submitted     | `{ rfqId, bidAmount, supplierId }` |
| `auction_extended`     | Auction time extended  | `{ rfqId, newEndTime }`            |
| `auction_closed`       | Normal auction close   | `{ rfqId }`                        |
| `auction_force_closed` | Forced close triggered | `{ rfqId }`                        |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.js             # Test data seeder
│   └── migrations/
├── src/
│   ├── app.js              # Express setup
│   ├── server.js           # HTTP server + Socket.io + cron
│   ├── controllers/        # Request/response handlers
│   ├── services/           # Business logic
│   │   ├── auction.service.js   # checkAndExtend engine
│   │   ├── bid.service.js
│   │   ├── rfq.service.js
│   │   └── ...
│   ├── routes/             # API route definitions
│   ├── middlewares/        # Auth, error handling
│   └── utils/
│       ├── db.js           # Prisma client
│       └── socket.js       # Socket.io instance
├── .env
└── package.json

client/
├── src/
│   ├── pages/              # Full page components
│   ├── components/         # Reusable UI components
│   ├── api/                # Axios API calls
│   ├── socket/             # Socket.io client
│   └── auth/               # Auth state management
└── package.json
```

---

## Auction Extension Logic

```
Bid submitted at 5:57 PM
Trigger Window: last 10 minutes (5:50–6:00 PM)
Extension Duration: 5 minutes

1. Is bid within trigger window? YES
2. Check trigger type:
   - BID_RECEIVED    → always extend
   - ANY_RANK_CHANGE → extend if any rank changed
   - L1_CHANGE       → extend only if lowest bidder changed
3. Calculate new end time: 6:00 + 5 = 6:05 PM
4. Cap at forced close time
5. Update RFQ.currentEndTime
6. Log to AuctionExtension + ActivityLog
7. Emit "auction_extended" via Socket.io
```

---

## Testing

Import the Postman collection from `/docs/british_auction_postman.json`

**Recommended test order:**

1. Login Buyer
2. Create RFQ → Activate it
3. Invite Suppliers
4. Login Supplier → Accept invite → Submit bid
5. Check rankings
6. Check activity log
7. Close auction

---

## License

MIT
