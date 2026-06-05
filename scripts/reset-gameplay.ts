/**
 * Reset gameplay state on the live DB.
 *
 * KEEPS (rows intact):
 *  - User identity columns (email, username, displayName, avatar, bio, phone,
 *    birthDate, interests, isProfileComplete, isAdmin, createdAt, emailVerified)
 *  - Lobby + LobbyMember rows (lobby structure preserved)
 *  - ShopItem + Achievement catalogs
 *
 * RESETS (User & LobbyMember columns):
 *  - User: xp=0, coins=0, level=1, streak=0, lastStreakDate=null,
 *          pushupTotalReps=0, lastPushupAt=null, equippedFrameValue=null,
 *          isSafeMode=false, safeModeExpires=null
 *  - LobbyMember: xpInLobby=0, customTitle=null
 *
 * WIPES (every row in these tables):
 *  Quest, QuestSubmission, VetoVote, SubmissionComment, Album, AlbumPhoto,
 *  UserLocation, UserShopItem, ActiveEffect, DailyCheckIn, UserAchievement,
 *  Notification, TriviaQuestion, UserTriviaAnswer, GameMatch, LobbyMessage,
 *  LobbyInvite, Friendship, PushSubscription, OtpCode, PendingSignup
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
connectionString = connectionString.replace(/&?channel_binding=[^&]*/g, "").replace(/\?&/, "?");

const adapter = new PrismaNeon({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("⚠️  Resetting gameplay data — keeping users + lobbies...");

  // 1) Wipe transactional / gameplay tables. Most have onDelete: Cascade
  //    so order matters only minimally; we still do children first to be safe.
  const wipeOps = [
    // submission tree
    prisma.submissionComment.deleteMany({}),
    prisma.vetoVote.deleteMany({}),
    prisma.albumPhoto.deleteMany({}),
    prisma.questSubmission.deleteMany({}),
    prisma.album.deleteMany({}),
    prisma.quest.deleteMany({}),
    // trivia + games
    prisma.userTriviaAnswer.deleteMany({}),
    prisma.triviaQuestion.deleteMany({}),
    prisma.gameMatch.deleteMany({}),
    // user-attached gameplay
    prisma.userAchievement.deleteMany({}),
    prisma.userShopItem.deleteMany({}),
    prisma.activeEffect.deleteMany({}),
    prisma.dailyCheckIn.deleteMany({}),
    prisma.notification.deleteMany({}),
    prisma.userLocation.deleteMany({}),
    // lobby ephemera
    prisma.lobbyMessage.deleteMany({}),
    prisma.lobbyInvite.deleteMany({}),
    // social + auth
    prisma.friendship.deleteMany({}),
    prisma.pushSubscription.deleteMany({}),
    prisma.otpCode.deleteMany({}),
    prisma.pendingSignup.deleteMany({}),
  ];

  for (const op of wipeOps) {
    const r = await op;
    console.log(`  wiped: ${r.count} rows`);
  }

  // 2) Reset gameplay columns on User (identity untouched).
  const userReset = await prisma.user.updateMany({
    data: {
      xp: 0,
      coins: 0,
      level: 1,
      streak: 0,
      lastStreakDate: null,
      lastPushupAt: null,
      pushupTotalReps: 0,
      equippedFrameValue: null,
      isSafeMode: false,
      safeModeExpires: null,
    },
  });
  console.log(`  User stats reset on ${userReset.count} rows`);

  // 3) Reset per-lobby progression columns on LobbyMember.
  const memberReset = await prisma.lobbyMember.updateMany({
    data: { xpInLobby: 0, customTitle: null },
  });
  console.log(`  LobbyMember stats reset on ${memberReset.count} rows`);

  console.log("✅ Done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
