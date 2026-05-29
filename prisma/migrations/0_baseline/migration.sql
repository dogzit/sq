-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LobbyRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CharacterClass" AS ENUM ('TANK', 'MAGE', 'CLOWN');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QuestType" AS ENUM ('DAILY', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "QuestDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "QuestStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('APPROVE', 'REJECT');

-- CreateEnum
CREATE TYPE "VetoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('NONE', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('TRIVIA', 'SPEED_TAP', 'EMOJI_GUESS', 'WORD_SCRAMBLE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "ShopItemType" AS ENUM ('TITLE', 'BUFF', 'DEBUFF');

-- CreateEnum
CREATE TYPE "EffectType" AS ENUM ('BUFF', 'DEBUFF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lobby" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxMembers" INTEGER NOT NULL DEFAULT 10,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyMember" (
    "id" TEXT NOT NULL,
    "role" "LobbyRole" NOT NULL DEFAULT 'MEMBER',
    "characterClass" "CharacterClass" NOT NULL DEFAULT 'TANK',
    "xpInLobby" INTEGER NOT NULL DEFAULT 0,
    "customTitle" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,

    CONSTRAINT "LobbyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyInvite" (
    "id" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "lobbyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LobbyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "description" TEXT,
    "bonusClass" "CharacterClass",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "difficulty" "QuestDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "difficulty" "QuestDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "questType" "QuestType" NOT NULL DEFAULT 'DAILY',
    "status" "QuestStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lobbyId" TEXT,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestSubmission" (
    "id" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "caption" TEXT,
    "vetoStatus" "VetoStatus" NOT NULL DEFAULT 'PENDING',
    "vetoDeadline" TIMESTAMP(3),
    "approveCount" INTEGER NOT NULL DEFAULT 0,
    "rejectCount" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "coinsAwarded" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "questId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestSubmission_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverUrl" TEXT,
    "videoUrl" TEXT,
    "videoStatus" "VideoStatus" NOT NULL DEFAULT 'NONE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumPhoto" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "albumId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlbumPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocation" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "sharing" BOOLEAN NOT NULL DEFAULT true,
    "visibleUntil" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QASession" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL DEFAULT 'TRIVIA',
    "status" "SessionStatus" NOT NULL DEFAULT 'WAITING',
    "roundCount" INTEGER NOT NULL DEFAULT 5,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "lobbyId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QASession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "timeLimit" INTEGER NOT NULL DEFAULT 15,
    "round" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QAAnswer" (
    "id" TEXT NOT NULL,
    "selectedIndex" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "responseTimeMs" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QAAnswer_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_xp_idx" ON "User"("xp" DESC);

-- CreateIndex
CREATE INDEX "User_coins_idx" ON "User"("coins" DESC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_email_key" ON "PendingSignup"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_username_key" ON "PendingSignup"("username");

-- CreateIndex
CREATE INDEX "PendingSignup_email_idx" ON "PendingSignup"("email");

-- CreateIndex
CREATE INDEX "OtpCode_userId_used_idx" ON "OtpCode"("userId", "used");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_code_key" ON "Lobby"("code");

-- CreateIndex
CREATE INDEX "Lobby_code_idx" ON "Lobby"("code");

-- CreateIndex
CREATE INDEX "Lobby_ownerId_idx" ON "Lobby"("ownerId");

-- CreateIndex
CREATE INDEX "LobbyMember_lobbyId_xpInLobby_idx" ON "LobbyMember"("lobbyId", "xpInLobby" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "LobbyMember_userId_lobbyId_key" ON "LobbyMember"("userId", "lobbyId");

-- CreateIndex
CREATE INDEX "LobbyInvite_lobbyId_idx" ON "LobbyInvite"("lobbyId");

-- CreateIndex
CREATE INDEX "LobbyInvite_receiverId_idx" ON "LobbyInvite"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestCategory_name_key" ON "QuestCategory"("name");

-- CreateIndex
CREATE INDEX "QuestCategory_bonusClass_idx" ON "QuestCategory"("bonusClass");

-- CreateIndex
CREATE INDEX "QuestTemplate_categoryId_idx" ON "QuestTemplate"("categoryId");

-- CreateIndex
CREATE INDEX "Quest_lobbyId_status_idx" ON "Quest"("lobbyId", "status");

-- CreateIndex
CREATE INDEX "Quest_questType_status_expiresAt_idx" ON "Quest"("questType", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "QuestSubmission_userId_idx" ON "QuestSubmission"("userId");

-- CreateIndex
CREATE INDEX "QuestSubmission_questId_idx" ON "QuestSubmission"("questId");

-- CreateIndex
CREATE INDEX "QuestSubmission_vetoStatus_vetoDeadline_idx" ON "QuestSubmission"("vetoStatus", "vetoDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "QuestSubmission_userId_questId_key" ON "QuestSubmission"("userId", "questId");

-- CreateIndex
CREATE INDEX "VetoVote_submissionId_idx" ON "VetoVote"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "VetoVote_voterId_submissionId_key" ON "VetoVote"("voterId", "submissionId");

-- CreateIndex
CREATE INDEX "Album_userId_idx" ON "Album"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumPhoto_submissionId_key" ON "AlbumPhoto"("submissionId");

-- CreateIndex
CREATE INDEX "AlbumPhoto_albumId_idx" ON "AlbumPhoto"("albumId");

-- CreateIndex
CREATE INDEX "UserLocation_userId_idx" ON "UserLocation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLocation_userId_key" ON "UserLocation"("userId");

-- CreateIndex
CREATE INDEX "QASession_lobbyId_idx" ON "QASession"("lobbyId");

-- CreateIndex
CREATE INDEX "QASession_status_idx" ON "QASession"("status");

-- CreateIndex
CREATE INDEX "QAQuestion_sessionId_idx" ON "QAQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "QAAnswer_questionId_idx" ON "QAAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QAAnswer_userId_questionId_key" ON "QAAnswer"("userId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_name_key" ON "ShopItem"("name");

-- CreateIndex
CREATE INDEX "UserShopItem_userId_used_idx" ON "UserShopItem"("userId", "used");

-- CreateIndex
CREATE INDEX "ActiveEffect_targetId_consumed_expiresAt_idx" ON "ActiveEffect"("targetId", "consumed", "expiresAt");

-- CreateIndex
CREATE INDEX "ActiveEffect_casterId_idx" ON "ActiveEffect"("casterId");

-- AddForeignKey
ALTER TABLE "OtpCode" ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyMember" ADD CONSTRAINT "LobbyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyMember" ADD CONSTRAINT "LobbyMember_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyInvite" ADD CONSTRAINT "LobbyInvite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyInvite" ADD CONSTRAINT "LobbyInvite_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyInvite" ADD CONSTRAINT "LobbyInvite_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestTemplate" ADD CONSTRAINT "QuestTemplate_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "QuestCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quest" ADD CONSTRAINT "Quest_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSubmission" ADD CONSTRAINT "QuestSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestSubmission" ADD CONSTRAINT "QuestSubmission_questId_fkey" FOREIGN KEY ("questId") REFERENCES "Quest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetoVote" ADD CONSTRAINT "VetoVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VetoVote" ADD CONSTRAINT "VetoVote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumPhoto" ADD CONSTRAINT "AlbumPhoto_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumPhoto" ADD CONSTRAINT "AlbumPhoto_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "QuestSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocation" ADD CONSTRAINT "UserLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QASession" ADD CONSTRAINT "QASession_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAQuestion" ADD CONSTRAINT "QAQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QASession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAAnswer" ADD CONSTRAINT "QAAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QAAnswer" ADD CONSTRAINT "QAAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QAQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopItem" ADD CONSTRAINT "UserShopItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShopItem" ADD CONSTRAINT "UserShopItem_shopItemId_fkey" FOREIGN KEY ("shopItemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEffect" ADD CONSTRAINT "ActiveEffect_casterId_fkey" FOREIGN KEY ("casterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveEffect" ADD CONSTRAINT "ActiveEffect_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

