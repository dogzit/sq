import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env") });

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
// Strip channel_binding param — not supported by Neon serverless
connectionString = connectionString.replace(/&?channel_binding=[^&]*/g, "").replace(/\?&/, "?");

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Quest-уудыг AI үүсгэдэг тул template/category seed хийхгүй.

  // ──────────────────────────────────────────
  // SHOP ITEMS  (30+ items with rarity)
  // ──────────────────────────────────────────
  const shopItems = [
    // ── Titles (COSMETIC) ──
    { name: "Quest Master", description: "The legendary neon title for true questers", price: 500, itemType: "TITLE" as const, value: "Quest Master", iconEmoji: "👑", rarity: "RARE" as const },
    { name: "Shadow Walker", description: "A mysterious dark title", price: 400, itemType: "TITLE" as const, value: "Shadow Walker", iconEmoji: "🌑", rarity: "RARE" as const },
    { name: "Neon God", description: "The ultimate cyberpunk flex", price: 1000, itemType: "TITLE" as const, value: "Neon God", iconEmoji: "⚡", rarity: "LEGENDARY" as const },
    { name: "Pixel Warrior", description: "Old school gamer vibes", price: 300, itemType: "TITLE" as const, value: "Pixel Warrior", iconEmoji: "🎮", rarity: "COMMON" as const },
    { name: "Meme Lord", description: "For the funniest in the lobby", price: 350, itemType: "TITLE" as const, value: "Meme Lord", iconEmoji: "😎", rarity: "COMMON" as const },
    { name: "Trailblazer", description: "First to complete every quest", price: 600, itemType: "TITLE" as const, value: "Trailblazer", iconEmoji: "🔥", rarity: "RARE" as const },
    { name: "Night Owl", description: "For those who quest after midnight", price: 200, itemType: "TITLE" as const, value: "Night Owl", iconEmoji: "🦉", rarity: "COMMON" as const },
    { name: "Speed Demon", description: "Fastest quest completer", price: 350, itemType: "TITLE" as const, value: "Speed Demon", iconEmoji: "💨", rarity: "COMMON" as const },
    { name: "Social Butterfly", description: "Always connecting people", price: 300, itemType: "TITLE" as const, value: "Social Butterfly", iconEmoji: "🦋", rarity: "COMMON" as const },
    { name: "Lone Wolf", description: "Solo quest legend", price: 450, itemType: "TITLE" as const, value: "Lone Wolf", iconEmoji: "🐺", rarity: "RARE" as const },
    { name: "Puzzle Master", description: "Trivia and brain games champion", price: 500, itemType: "TITLE" as const, value: "Puzzle Master", iconEmoji: "🧩", rarity: "RARE" as const },
    { name: "Iron Will", description: "Never breaks a streak", price: 600, itemType: "TITLE" as const, value: "Iron Will", iconEmoji: "🛡️", rarity: "EPIC" as const },

    // ── Buffs (target others) ──
    { name: "Ивээх (Bless)", description: "Grant a friend +25% XP for 24 hours", price: 150, itemType: "BUFF" as const, value: "1.25", iconEmoji: "✨", rarity: "COMMON" as const },
    { name: "Double Blessing", description: "Grant a friend +50% XP for 24 hours", price: 400, itemType: "BUFF" as const, value: "1.50", iconEmoji: "🌟", rarity: "RARE" as const },
    { name: "Squad Boost", description: "Grant a friend +75% XP for 24 hours", price: 700, itemType: "BUFF" as const, value: "1.75", iconEmoji: "🚀", rarity: "EPIC" as const },

    // ── Debuffs (target others) ──
    { name: "Хараах (Curse)", description: "Reduce an enemy's XP by 25% for 24 hours", price: 180, itemType: "DEBUFF" as const, value: "0.75", iconEmoji: "💀", rarity: "COMMON" as const },
    { name: "Heavy Curse", description: "Reduce an enemy's XP by 50% for 24 hours", price: 450, itemType: "DEBUFF" as const, value: "0.50", iconEmoji: "☠️", rarity: "RARE" as const },
    { name: "Slow Down", description: "Reduce an enemy's XP by 15% for 24 hours", price: 100, itemType: "DEBUFF" as const, value: "0.85", iconEmoji: "🐌", rarity: "COMMON" as const },

    // ── XP Boosts (self-buff) ──
    { name: "Focus Mode", description: "Boost your own XP by +15% for 12 hours", price: 100, itemType: "XP_BOOST" as const, value: "1.15", iconEmoji: "🎯", rarity: "COMMON" as const },
    { name: "Power Surge", description: "Boost your own XP by +30% for 24 hours", price: 300, itemType: "XP_BOOST" as const, value: "1.30", iconEmoji: "⚡", rarity: "RARE" as const },
    { name: "Ascension", description: "Boost your own XP by +50% for 24 hours", price: 800, itemType: "XP_BOOST" as const, value: "1.50", iconEmoji: "🌈", rarity: "EPIC" as const },

    // ── Quest Reroll ──
    { name: "Quest Reroll", description: "Swap an unwanted daily quest for a new one", price: 150, itemType: "QUEST_REROLL" as const, value: "1", iconEmoji: "🔄", rarity: "COMMON" as const },
    { name: "Golden Reroll", description: "Reroll and guarantee a HARD+ quest with bonus XP", price: 400, itemType: "QUEST_REROLL" as const, value: "hard", iconEmoji: "🎰", rarity: "RARE" as const },

    // ── Avatar Frames ──
    { name: "Neon Ring", description: "Glowing neon circle around your avatar", price: 200, itemType: "AVATAR_FRAME" as const, value: "neon-ring", iconEmoji: "💜", rarity: "COMMON" as const },
    { name: "Fire Frame", description: "Burning flame border", price: 400, itemType: "AVATAR_FRAME" as const, value: "fire-frame", iconEmoji: "🔥", rarity: "RARE" as const },
    { name: "Ice Crown", description: "Frosty ice crystal border", price: 500, itemType: "AVATAR_FRAME" as const, value: "ice-crown", iconEmoji: "❄️", rarity: "RARE" as const },
    { name: "Galaxy Border", description: "Cosmic swirling galaxy effect", price: 800, itemType: "AVATAR_FRAME" as const, value: "galaxy-border", iconEmoji: "🌌", rarity: "EPIC" as const },
    { name: "Dragon Frame", description: "Ancient dragon-scale border", price: 1200, itemType: "AVATAR_FRAME" as const, value: "dragon-frame", iconEmoji: "🐉", rarity: "LEGENDARY" as const },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      update: { price: item.price, rarity: item.rarity, description: item.description },
      create: item,
    });
  }

  // ──────────────────────────────────────────
  // ACHIEVEMENTS
  // ──────────────────────────────────────────
  const achievements = [
    { key: "first_quest", name: "First Steps", description: "Complete your first quest", iconEmoji: "🎯", coinReward: 50, rarity: "COMMON" as const },
    { key: "streak_7", name: "Lucky Seven", description: "Maintain a 7-day streak", iconEmoji: "🔥", coinReward: 100, rarity: "COMMON" as const },
    { key: "streak_30", name: "Month Warrior", description: "Maintain a 30-day streak", iconEmoji: "💎", coinReward: 500, rarity: "EPIC" as const },
    { key: "social_3", name: "Social Butterfly", description: "Join 3 different lobbies", iconEmoji: "🦋", coinReward: 75, rarity: "COMMON" as const },
    { key: "voter_10", name: "Voter", description: "Cast 10 votes on submissions", iconEmoji: "🗳️", coinReward: 50, rarity: "COMMON" as const },
    { key: "voter_50", name: "Jury Duty", description: "Cast 50 votes on submissions", iconEmoji: "⚖️", coinReward: 200, rarity: "RARE" as const },
    { key: "big_spender", name: "Big Spender", description: "Spend 1000 coins total in the shop", iconEmoji: "💰", coinReward: 100, rarity: "RARE" as const },
    { key: "level_10", name: "Level 10", description: "Reach level 10", iconEmoji: "⭐", coinReward: 200, rarity: "RARE" as const },
    { key: "emergency", name: "Emergency Hero", description: "Complete an emergency quest", iconEmoji: "🚨", coinReward: 150, rarity: "RARE" as const },
    { key: "trivia_perfect", name: "Trivia King", description: "Get 100% on a trivia game", iconEmoji: "🧠", coinReward: 100, rarity: "RARE" as const },
    { key: "profile_complete", name: "Profile Complete", description: "Complete your full profile (birthday, interests, bio)", iconEmoji: "🪪", xpReward: 100, coinReward: 50, rarity: "COMMON" as const },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      update: {},
      create: ach,
    });
  }

  // ──────────────────────────────────────────
  // TRIVIA BANK removed — replaced by user-created TriviaQuestion
  // ──────────────────────────────────────────

  console.log(`Seeded ${shopItems.length} shop items`);
  console.log(`Seeded ${achievements.length} achievements`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
