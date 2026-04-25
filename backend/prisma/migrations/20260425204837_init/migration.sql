-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BUYER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "AuctionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'FORCED_CLOSED');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('INVITED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExtensionTriggerType" AS ENUM ('BID_RECEIVED', 'ANY_RANK_CHANGE', 'L1_CHANGE');

-- CreateEnum
CREATE TYPE "BidSource" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('VALID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('BID_PLACED', 'EXTENSION_TRIGGERED', 'AUCTION_CLOSED', 'AUCTION_FORCED_CLOSED', 'ERROR');

-- CreateEnum
CREATE TYPE "ActivityEventCategory" AS ENUM ('BID', 'SYSTEM', 'EXTENSION', 'AUCTION');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('SYSTEM', 'BUYER', 'SUPPLIER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('BUYER', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVITATION', 'STATUS_CHANGE', 'OUTBID', 'AUCTION_EXTENDED', 'AUCTION_CLOSED');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('INR', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQ" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "bidCloseTime" TIMESTAMP(3) NOT NULL,
    "forcedCloseTime" TIMESTAMP(3) NOT NULL,
    "currentEndTime" TIMESTAMP(3) NOT NULL,
    "status" "AuctionStatus" NOT NULL,
    "initialPrice" DECIMAL(65,30) NOT NULL,
    "currency" "Currency" NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionConfig" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "extensionWindow" INTEGER NOT NULL,
    "extensionDuration" INTEGER NOT NULL,
    "maxExtensions" INTEGER,
    "extensionType" "ExtensionTriggerType" NOT NULL,
    "minDecrement" DECIMAL(65,30) NOT NULL,
    "extensionEnabled" BOOLEAN NOT NULL,
    "autoBidEnabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RFQSupplier" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL,
    "lastActivityAt" TIMESTAMP(3),

    CONSTRAINT "RFQSupplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "bidId" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "bidAmount" DECIMAL(65,30) NOT NULL,
    "bidSource" "BidSource" NOT NULL,
    "status" "BidStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("bidId")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "carrierName" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "freightCharges" DECIMAL(65,30) NOT NULL,
    "originCharges" DECIMAL(65,30) NOT NULL,
    "destinationCharges" DECIMAL(65,30) NOT NULL,
    "transitTime" INTEGER NOT NULL,
    "validityDate" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "isLatest" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "eventType" "ActivityEventType" NOT NULL,
    "eventCategory" "ActivityEventCategory" NOT NULL,
    "actorId" TEXT,
    "actorType" "ActorType" NOT NULL,
    "correlationId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionExtension" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "triggerType" "ExtensionTriggerType" NOT NULL,
    "triggerTime" TIMESTAMP(3) NOT NULL,
    "oldEndTime" TIMESTAMP(3) NOT NULL,
    "newEndTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionExtension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rfqId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "RFQ_status_currentEndTime_idx" ON "RFQ"("status", "currentEndTime");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionConfig_rfqId_key" ON "AuctionConfig"("rfqId");

-- CreateIndex
CREATE UNIQUE INDEX "RFQSupplier_rfqId_supplierId_key" ON "RFQSupplier"("rfqId", "supplierId");

-- CreateIndex
CREATE INDEX "Bid_rfqId_bidAmount_createdAt_idx" ON "Bid"("rfqId", "bidAmount", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_bidId_key" ON "Quote"("bidId");

-- CreateIndex
CREATE INDEX "ActivityLog_rfqId_createdAt_idx" ON "ActivityLog"("rfqId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionConfig" ADD CONSTRAINT "AuctionConfig_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplier" ADD CONSTRAINT "RFQSupplier_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RFQSupplier" ADD CONSTRAINT "RFQSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "Bid"("bidId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionExtension" ADD CONSTRAINT "AuctionExtension_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;
