import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const minutesFromNow = (mins) =>
  new Date(Date.now() + mins * 60 * 1000);

const hoursFromNow = (hrs) =>
  new Date(Date.now() + hrs * 60 * 60 * 1000);

const daysFromNow = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────
// MAIN SEED
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── 1. CLEAN DATABASE ──────────────────────
  console.log("🧹 Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.auctionExtension.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.rFQSupplier.deleteMany();
  await prisma.auctionConfig.deleteMany();
  await prisma.rFQ.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  console.log("✅ Database cleaned\n");

  // ── 2. COMPANIES ───────────────────────────
  console.log("🏢 Creating companies...");
  const buyerCompany = await prisma.company.create({
    data: {
      id: "company-buyer-001",
      name: "Reliance Industries Ltd",
      type: "BUYER",
    },
  });

  const supplierCompany1 = await prisma.company.create({
    data: {
      id: "company-supplier-001",
      name: "DHL Express India",
      type: "SUPPLIER",
    },
  });

  const supplierCompany2 = await prisma.company.create({
    data: {
      id: "company-supplier-002",
      name: "Blue Dart Logistics",
      type: "SUPPLIER",
    },
  });

  const supplierCompany3 = await prisma.company.create({
    data: {
      id: "company-supplier-003",
      name: "FedEx India Pvt Ltd",
      type: "SUPPLIER",
    },
  });

  console.log("✅ Companies created\n");

  // ── 3. USERS ───────────────────────────────
  console.log("👤 Creating users...");
  const hashedPassword = await bcryptjs.hash("Password123", 10);

  const buyer = await prisma.user.create({
    data: {
      name: "Alice Sharma",
      email: "buyer@test.com",
      password: hashedPassword,
      role: "BUYER",
      companyId: buyerCompany.id,
    },
  });

  const supplier1 = await prisma.user.create({
    data: {
      name: "Bob Mehta",
      email: "supplier1@test.com",
      password: hashedPassword,
      role: "SUPPLIER",
      companyId: supplierCompany1.id,
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      name: "Carol Patel",
      email: "supplier2@test.com",
      password: hashedPassword,
      role: "SUPPLIER",
      companyId: supplierCompany2.id,
    },
  });

  const supplier3 = await prisma.user.create({
    data: {
      name: "Dave Singh",
      email: "supplier3@test.com",
      password: hashedPassword,
      role: "SUPPLIER",
      companyId: supplierCompany3.id,
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@test.com",
      password: hashedPassword,
      role: "ADMIN",
      companyId: buyerCompany.id,
    },
  });

  console.log("✅ Users created");
  console.log("   buyer@test.com     → BUYER");
  console.log("   supplier1@test.com → SUPPLIER (DHL)");
  console.log("   supplier2@test.com → SUPPLIER (Blue Dart)");
  console.log("   supplier3@test.com → SUPPLIER (FedEx)");
  console.log("   admin@test.com     → ADMIN");
  console.log("   All passwords: Password123\n");

  // ── 4. RFQs ────────────────────────────────
  console.log("📋 Creating RFQs...\n");

  // RFQ 1 — ACTIVE, BID_RECEIVED trigger, suppliers already invited + accepted
  console.log("  Creating RFQ 1: ACTIVE auction (BID_RECEIVED)...");
  const rfq1 = await prisma.rFQ.create({
    data: {
      name: "Delhi to Mumbai Bulk Shipment",
      buyerId: buyer.id,
      startTime: minutesFromNow(-30),
      bidCloseTime: hoursFromNow(2),
      forcedCloseTime: hoursFromNow(3),
      currentEndTime: hoursFromNow(2),
      status: "ACTIVE",
      initialPrice: 100000,
      currency: "INR",
      pickupDate: daysFromNow(5),
      config: {
        create: {
          extensionWindow: 10,
          extensionDuration: 5,
          extensionType: "BID_RECEIVED",
          extensionEnabled: true,
          minDecrement: 500,
          autoBidEnabled: false,
        },
      },
      suppliers: {
        create: [
          { supplierId: supplier1.id, status: "ACCEPTED" },
          { supplierId: supplier2.id, status: "ACCEPTED" },
          { supplierId: supplier3.id, status: "INVITED" },
        ],
      },
    },
  });

  // Add bids to RFQ 1
  const bid1 = await prisma.bid.create({
    data: {
      rfqId: rfq1.id,
      supplierId: supplier1.id,
      bidAmount: 48000,
      bidSource: "MANUAL",
      status: "VALID",
      createdAt: minutesFromNow(-20),
      quote: {
        create: {
          carrierName: "DHL Express",
          freightCharges: 35000,
          originCharges: 7000,
          destinationCharges: 6000,
          transitTime: 3,
          validityDate: daysFromNow(7),
          status: "ACTIVE",
          versionNumber: 1,
          isLatest: false,
        },
      },
    },
  });

  const bid2 = await prisma.bid.create({
    data: {
      rfqId: rfq1.id,
      supplierId: supplier2.id,
      bidAmount: 45000,
      bidSource: "MANUAL",
      status: "VALID",
      createdAt: minutesFromNow(-15),
      quote: {
        create: {
          carrierName: "Blue Dart",
          freightCharges: 33000,
          originCharges: 6000,
          destinationCharges: 6000,
          transitTime: 4,
          validityDate: daysFromNow(7),
          status: "ACTIVE",
          versionNumber: 1,
          isLatest: false,
        },
      },
    },
  });

  const bid3 = await prisma.bid.create({
    data: {
      rfqId: rfq1.id,
      supplierId: supplier1.id,
      bidAmount: 42000,
      bidSource: "MANUAL",
      status: "VALID",
      createdAt: minutesFromNow(-10),
      quote: {
        create: {
          carrierName: "DHL Express",
          freightCharges: 31000,
          originCharges: 5500,
          destinationCharges: 5500,
          transitTime: 3,
          validityDate: daysFromNow(7),
          status: "ACTIVE",
          versionNumber: 2,
          isLatest: true,
        },
      },
    },
  });

  // Activity logs for RFQ 1
  await prisma.activityLog.createMany({
    data: [
      {
        rfqId: rfq1.id,
        eventType: "BID_PLACED",
        eventCategory: "BID",
        actorId: supplier1.id,
        actorType: "SUPPLIER",
        newValue: { bidAmount: 48000, bidId: bid1.bidId },
        createdAt: minutesFromNow(-20),
      },
      {
        rfqId: rfq1.id,
        eventType: "BID_PLACED",
        eventCategory: "BID",
        actorId: supplier2.id,
        actorType: "SUPPLIER",
        newValue: { bidAmount: 45000, bidId: bid2.bidId },
        createdAt: minutesFromNow(-15),
      },
      {
        rfqId: rfq1.id,
        eventType: "EXTENSION_TRIGGERED",
        eventCategory: "EXTENSION",
        actorType: "SYSTEM",
        oldValue: { endTime: hoursFromNow(2).toISOString() },
        newValue: { endTime: hoursFromNow(2).toISOString(), reason: "BID_RECEIVED" },
        createdAt: minutesFromNow(-15),
      },
      {
        rfqId: rfq1.id,
        eventType: "BID_PLACED",
        eventCategory: "BID",
        actorId: supplier1.id,
        actorType: "SUPPLIER",
        newValue: { bidAmount: 42000, bidId: bid3.bidId },
        createdAt: minutesFromNow(-10),
      },
    ],
  });

  console.log(`  ✅ RFQ 1 created: ${rfq1.id}`);
  console.log("     Status: ACTIVE | Trigger: BID_RECEIVED | 3 bids placed\n");

  // RFQ 2 — ACTIVE, ANY_RANK_CHANGE trigger, no bids yet
  console.log("  Creating RFQ 2: ACTIVE auction (ANY_RANK_CHANGE), no bids...");
  const rfq2 = await prisma.rFQ.create({
    data: {
      name: "Mumbai to Chennai Container Cargo",
      buyerId: buyer.id,
      startTime: minutesFromNow(-10),
      bidCloseTime: hoursFromNow(4),
      forcedCloseTime: hoursFromNow(5),
      currentEndTime: hoursFromNow(4),
      status: "ACTIVE",
      initialPrice: 75000,
      currency: "INR",
      pickupDate: daysFromNow(7),
      config: {
        create: {
          extensionWindow: 15,
          extensionDuration: 10,
          extensionType: "ANY_RANK_CHANGE",
          extensionEnabled: true,
          minDecrement: 1000,
          autoBidEnabled: false,
        },
      },
      suppliers: {
        create: [
          { supplierId: supplier1.id, status: "ACCEPTED" },
          { supplierId: supplier2.id, status: "ACCEPTED" },
          { supplierId: supplier3.id, status: "ACCEPTED" },
        ],
      },
    },
  });

  console.log(`  ✅ RFQ 2 created: ${rfq2.id}`);
  console.log("     Status: ACTIVE | Trigger: ANY_RANK_CHANGE | Ready for bids\n");

  // RFQ 3 — DRAFT, L1_CHANGE trigger
  console.log("  Creating RFQ 3: DRAFT auction (L1_CHANGE)...");
  const rfq3 = await prisma.rFQ.create({
    data: {
      name: "Bangalore to Hyderabad Express Freight",
      buyerId: buyer.id,
      startTime: hoursFromNow(1),
      bidCloseTime: hoursFromNow(5),
      forcedCloseTime: hoursFromNow(6),
      currentEndTime: hoursFromNow(5),
      status: "DRAFT",
      initialPrice: 50000,
      currency: "INR",
      pickupDate: daysFromNow(3),
      config: {
        create: {
          extensionWindow: 5,
          extensionDuration: 3,
          extensionType: "L1_CHANGE",
          extensionEnabled: true,
          minDecrement: 250,
          autoBidEnabled: false,
        },
      },
      suppliers: {
        create: [
          { supplierId: supplier2.id, status: "INVITED" },
          { supplierId: supplier3.id, status: "INVITED" },
        ],
      },
    },
  });

  console.log(`  ✅ RFQ 3 created: ${rfq3.id}`);
  console.log("     Status: DRAFT | Trigger: L1_CHANGE | Not started\n");

  // RFQ 4 — CLOSED, completed auction with full bid history
  console.log("  Creating RFQ 4: CLOSED completed auction...");
  const rfq4 = await prisma.rFQ.create({
    data: {
      name: "Delhi to Kolkata Refrigerated Cargo",
      buyerId: buyer.id,
      startTime: daysFromNow(-2),
      bidCloseTime: daysFromNow(-1),
      forcedCloseTime: new Date(Date.now() - 20 * 60 * 60 * 1000),
      currentEndTime: daysFromNow(-1),
      status: "CLOSED",
      initialPrice: 120000,
      currency: "INR",
      pickupDate: daysFromNow(1),
      config: {
        create: {
          extensionWindow: 10,
          extensionDuration: 5,
          extensionType: "BID_RECEIVED",
          extensionEnabled: true,
          minDecrement: 1000,
          autoBidEnabled: false,
        },
      },
      suppliers: {
        create: [
          { supplierId: supplier1.id, status: "ACCEPTED" },
          { supplierId: supplier2.id, status: "ACCEPTED" },
          { supplierId: supplier3.id, status: "ACCEPTED" },
        ],
      },
    },
  });

  // Closed RFQ bids
  await prisma.bid.create({
    data: {
      rfqId: rfq4.id,
      supplierId: supplier3.id,
      bidAmount: 55000,
      bidSource: "MANUAL",
      status: "VALID",
      createdAt: daysFromNow(-1),
      quote: {
        create: {
          carrierName: "FedEx India",
          freightCharges: 40000,
          originCharges: 8000,
          destinationCharges: 7000,
          transitTime: 2,
          validityDate: daysFromNow(5),
          status: "ACTIVE",
          versionNumber: 1,
          isLatest: true,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      rfqId: rfq4.id,
      eventType: "AUCTION_CLOSED",
      eventCategory: "AUCTION",
      actorType: "SYSTEM",
      createdAt: daysFromNow(-1),
    },
  });

  console.log(`  ✅ RFQ 4 created: ${rfq4.id}`);
  console.log("     Status: CLOSED | Full bid history available\n");

  // ── 5. PRINT SUMMARY ───────────────────────
  console.log("═══════════════════════════════════════");
  console.log("✅ SEED COMPLETE");
  console.log("═══════════════════════════════════════\n");

  console.log("LOGIN CREDENTIALS (all passwords: Password123)");
  console.log("──────────────────────────────────────────────");
  console.log(`buyer@test.com      → BUYER    (${buyer.id})`);
  console.log(`supplier1@test.com  → SUPPLIER (${supplier1.id})`);
  console.log(`supplier2@test.com  → SUPPLIER (${supplier2.id})`);
  console.log(`supplier3@test.com  → SUPPLIER (${supplier3.id})`);
  console.log(`admin@test.com      → ADMIN    (${admin.id})\n`);

  console.log("RFQ SUMMARY");
  console.log("──────────────────────────────────────────────");
  console.log(`RFQ 1 (ACTIVE,  BID_RECEIVED):    ${rfq1.id}`);
  console.log(`RFQ 2 (ACTIVE,  ANY_RANK_CHANGE): ${rfq2.id}`);
  console.log(`RFQ 3 (DRAFT,   L1_CHANGE):       ${rfq3.id}`);
  console.log(`RFQ 4 (CLOSED,  BID_RECEIVED):    ${rfq4.id}\n`);

  console.log("TESTING GUIDE");
  console.log("──────────────────────────────────────────────");
  console.log("1. Login as buyer@test.com");
  console.log("2. Use RFQ 2 ID to submit bids (login as supplier first)");
  console.log("3. RFQ 1 already has bids — check rankings");
  console.log("4. RFQ 3 is DRAFT — activate it with PATCH /status");
  console.log("5. RFQ 4 is CLOSED — check activity log history\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
