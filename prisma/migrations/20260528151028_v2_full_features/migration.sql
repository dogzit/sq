/*
  Warnings:

  - You are about to drop the column `verified` on the `QuestSubmission` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Album` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('TANK', 'MAGE', 'CLOWN');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "VetoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('TITLE', 'BUFF', 'DEBUFF');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('BUFF', 'DEBUFF');

-- DropIndex
DROP INDEX "LobbyMember_lobbyId_idx";

-- DropIndex
DROP INDEX "Quest_lobbyId_idx";

-- DropIndex
DROP INDEX "Quest_status_expiresAt_idx";

-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LobbyMember" ADD COLUMN     "characterClass" "CharacterClass" NOT NULL DEFAULT 'TANK',
ADD COLUMN     "customTitle" TEXT;

-- AlterTable
ALTER TABLE "Quest" ADD COLUMN     "questType" "QuestType" NOT NULL DEFAULT 'DAILY';

-- AlterTable
ALTER TABLE "QuestCategory" ADD COLUMN     "bonusClass" "CharacterClass";

-- AlterTable
ALTER TABLE "QuestSubmission" DROP COLUMN "verified",
ADD COLUMN     "approveCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rejectCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vetoDeadline" TIMESTAMP(3),
ADD COLUMN     "vetoStatus" "VetoStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "UserLocation" ADD COLUMN     "visibleUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "VetoVote" (
    "id" TEXT NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "voterId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VetoVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "itemType" "ShopItemType" NOT NULL,
    "value" TEXT NOT NULL,
    "iconEmoji" TEXT NOT NULL DEFAULT '🎁',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShopItem" (
    "id" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "shopItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiveEffect" (
    "id" TEXT NOT NULL,
    "effectType" "EffectType" NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "casterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActiveEffect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VetoVote_submissionId_idx" ON "VetoVote"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "VetoVote_voterId_submissionId_key" ON "VetoVote"("voterId", "submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_name_key" ON "ShopItem"("name");

-- CreateIndex
CREATE INDEX "UserShopItem_userId_used_idx" ON "UserShopItem"("userId", "used");

-- CreateIndex
CREATE INDEX "ActiveEffect_targetId_consumed_expiresAt_idx" ON "ActiveEffect"("targetId", "consumed", "expiresAt");

-- CreateIndex
CREATE INDEX "ActiveEffect_casterId_idx" ON "ActiveEffect"("casterId");

-- CreateIndex
CREATE INDEX "Album_userId_idx" ON "Album"("userId");

-- CreateIndex
CREATE INDEX "LobbyMember_lobbyId_xpInLobby_idx" ON "LobbyMember"("lobbyId", "xpInLobby" DESC);

-- CreateIndex
CREATE INDEX "Quest_lobbyId_status_idx" ON "Quest"("lobbyId", "status");

-- CreateIndex
CREATE INDEX "Quest_questType_status_expiresAt_idx" ON "Quest"("questType", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "QuestCategory_bonusClass_idx" ON "QuestCategory"("bonusClass");

-- CreateIndex
CREATE INDEX "QuestSubmission_vetoStatus_vetoDeadline_idx" ON "QuestSubmission"("vetoStatus", "vetoDeadline");

-- AddForeignKey
ALTER TABLE "VetoVote" ADD CONSTRAINT "VetoVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetoVote" ADD CONSTRAINT "VetoVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopItem" ADD CONSTRAINT "UserShopItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopItem" ADD CONSTRAINT "UserShopItem_shopItemId_fkey" FOREIGN KEY ("shopItemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEffect" ADD CONSTRAINT "ActiveEffect_casterId_fkey" FOREIGN KEY ("casterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEffect" ADD CONSTRAINT "ActiveEffect_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
