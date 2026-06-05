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
  // ── Pricing model (≈ daily earn rate ~150 coins for an active player) ──
  //   COMMON consumable: 250–400  (1–3 days)
  //   RARE   consumable: 800–1.1k (5–7 days)
  //   EPIC   consumable: 2.2k     (~2 weeks)
  //   COMMON cosmetic:   600–900  (4–6 days, owned forever)
  //   RARE   cosmetic:   1.2k–1.5k (~10 days)
  //   EPIC   cosmetic:   2.5k–3k   (~3 weeks)
  //   LEGENDARY animated: 5k–6.5k  (~5+ weeks — the real flex tier)
  const shopItems = [
    // ── Titles (COSMETIC, owned forever) ──
    { name: "Pixel Warrior", description: "Old school gamer vibes", price: 800, itemType: "TITLE" as const, value: "Pixel Warrior", iconEmoji: "🎮", rarity: "COMMON" as const },
    { name: "Night Owl", description: "For those who quest after midnight", price: 600, itemType: "TITLE" as const, value: "Night Owl", iconEmoji: "🦉", rarity: "COMMON" as const },
    { name: "Speed Demon", description: "Fastest quest completer", price: 900, itemType: "TITLE" as const, value: "Speed Demon", iconEmoji: "💨", rarity: "COMMON" as const },
    { name: "Social Butterfly", description: "Always connecting people", price: 800, itemType: "TITLE" as const, value: "Social Butterfly", iconEmoji: "🦋", rarity: "COMMON" as const },
    { name: "Meme Lord", description: "For the funniest in the lobby", price: 900, itemType: "TITLE" as const, value: "Meme Lord", iconEmoji: "😎", rarity: "COMMON" as const },
    { name: "Shadow Walker", description: "A mysterious dark title", price: 1200, itemType: "TITLE" as const, value: "Shadow Walker", iconEmoji: "🌑", rarity: "RARE" as const },
    { name: "Lone Wolf", description: "Solo quest legend", price: 1300, itemType: "TITLE" as const, value: "Lone Wolf", iconEmoji: "🐺", rarity: "RARE" as const },
    { name: "Quest Master", description: "The legendary neon title for true questers", price: 1500, itemType: "TITLE" as const, value: "Quest Master", iconEmoji: "👑", rarity: "RARE" as const },
    { name: "Puzzle Master", description: "Trivia and brain games champion", price: 1500, itemType: "TITLE" as const, value: "Puzzle Master", iconEmoji: "🧩", rarity: "RARE" as const },
    { name: "Trailblazer", description: "First to complete every quest", price: 1800, itemType: "TITLE" as const, value: "Trailblazer", iconEmoji: "🔥", rarity: "RARE" as const },
    { name: "Iron Will", description: "Never breaks a streak", price: 2500, itemType: "TITLE" as const, value: "Iron Will", iconEmoji: "🛡️", rarity: "EPIC" as const },
    { name: "Neon God", description: "The ultimate cyberpunk flex", price: 5000, itemType: "TITLE" as const, value: "Neon God", iconEmoji: "⚡", rarity: "LEGENDARY" as const },

    // ── Buffs (consumable: target a friend) ──
    { name: "Ивээх (Bless)", description: "Grant a friend +25% XP for 24 hours", price: 300, itemType: "BUFF" as const, value: "1.25", iconEmoji: "✨", rarity: "COMMON" as const },
    { name: "Double Blessing", description: "Grant a friend +50% XP for 24 hours", price: 900, itemType: "BUFF" as const, value: "1.50", iconEmoji: "🌟", rarity: "RARE" as const },
    { name: "Squad Boost", description: "Grant a friend +75% XP for 24 hours", price: 1800, itemType: "BUFF" as const, value: "1.75", iconEmoji: "🚀", rarity: "EPIC" as const },

    // ── Debuffs (consumable: target an enemy) ──
    { name: "Slow Down", description: "Reduce an enemy's XP by 15% for 24 hours", price: 250, itemType: "DEBUFF" as const, value: "0.85", iconEmoji: "🐌", rarity: "COMMON" as const },
    { name: "Хараах (Curse)", description: "Reduce an enemy's XP by 25% for 24 hours", price: 400, itemType: "DEBUFF" as const, value: "0.75", iconEmoji: "💀", rarity: "COMMON" as const },
    { name: "Heavy Curse", description: "Reduce an enemy's XP by 50% for 24 hours", price: 1100, itemType: "DEBUFF" as const, value: "0.50", iconEmoji: "☠️", rarity: "RARE" as const },

    // ── XP Boosts (consumable: self) ──
    { name: "Focus Mode", description: "Boost your own XP by +15% for 12 hours", price: 250, itemType: "XP_BOOST" as const, value: "1.15", iconEmoji: "🎯", rarity: "COMMON" as const },
    { name: "Power Surge", description: "Boost your own XP by +30% for 24 hours", price: 700, itemType: "XP_BOOST" as const, value: "1.30", iconEmoji: "⚡", rarity: "RARE" as const },
    { name: "Ascension", description: "Boost your own XP by +50% for 24 hours", price: 2200, itemType: "XP_BOOST" as const, value: "1.50", iconEmoji: "🌈", rarity: "EPIC" as const },

    // ── Quest Reroll (consumable) ──
    { name: "Quest Reroll", description: "Swap an unwanted daily quest for a new one", price: 350, itemType: "QUEST_REROLL" as const, value: "1", iconEmoji: "🔄", rarity: "COMMON" as const },
    { name: "Golden Reroll", description: "Reroll and guarantee a HARD+ quest with bonus XP", price: 1000, itemType: "QUEST_REROLL" as const, value: "hard", iconEmoji: "🎰", rarity: "RARE" as const },

    // ── Avatar Frames — static (owned forever) ──
    { name: "Neon Ring", description: "Glowing neon circle around your avatar", price: 600, itemType: "AVATAR_FRAME" as const, value: "neon-ring", iconEmoji: "💜", rarity: "COMMON" as const },
    { name: "Fire Frame", description: "Burning flame border", price: 1200, itemType: "AVATAR_FRAME" as const, value: "fire-frame", iconEmoji: "🔥", rarity: "RARE" as const },
    { name: "Ice Crown", description: "Frosty ice crystal border", price: 1500, itemType: "AVATAR_FRAME" as const, value: "ice-crown", iconEmoji: "❄️", rarity: "RARE" as const },
    { name: "Galaxy Border", description: "Cosmic swirling galaxy effect", price: 2500, itemType: "AVATAR_FRAME" as const, value: "galaxy-border", iconEmoji: "🌌", rarity: "EPIC" as const },
    { name: "Dragon Frame", description: "Ancient dragon-scale border", price: 5000, itemType: "AVATAR_FRAME" as const, value: "dragon-frame", iconEmoji: "🐉", rarity: "LEGENDARY" as const },

    // ── Avatar Frames — ANIMATED ✨ (ML-style "alive" borders) ──
    { name: "Phoenix Pulse", description: "Heartbeat-glowing ring of phoenix flame", price: 2800, itemType: "AVATAR_FRAME" as const, value: "phoenix-pulse", iconEmoji: "🦅", rarity: "EPIC" as const },
    { name: "Void Pulse", description: "Pulsating violet aura from the void", price: 2800, itemType: "AVATAR_FRAME" as const, value: "void-pulse", iconEmoji: "🟣", rarity: "EPIC" as const },
    { name: "Lightning Flicker", description: "Crackling electric border that flickers like a storm", price: 3000, itemType: "AVATAR_FRAME" as const, value: "lightning-flicker", iconEmoji: "⚡", rarity: "EPIC" as const },
    { name: "Diamond Sparkle", description: "Spinning prism with floating sparkles", price: 5500, itemType: "AVATAR_FRAME" as const, value: "diamond-sparkle", iconEmoji: "💎", rarity: "LEGENDARY" as const },
    { name: "Eclipse Spin", description: "Sun-and-eclipse halo rotating endlessly", price: 6000, itemType: "AVATAR_FRAME" as const, value: "eclipse-spin", iconEmoji: "🌗", rarity: "LEGENDARY" as const },
    { name: "Aurora Spin", description: "Living aurora-borealis ring", price: 6000, itemType: "AVATAR_FRAME" as const, value: "aurora-spin", iconEmoji: "🌈", rarity: "LEGENDARY" as const },
    { name: "Rainbow Pulse", description: "Slowly cycling rainbow hue — the ultimate flex", price: 6500, itemType: "AVATAR_FRAME" as const, value: "rainbow-pulse", iconEmoji: "🎆", rarity: "LEGENDARY" as const },
    { name: "Cosmic Rainbow", description: "Galaxy-rainbow spin with deep cosmic glow", price: 7500, itemType: "AVATAR_FRAME" as const, value: "cosmic-rainbow", iconEmoji: "🌌", rarity: "LEGENDARY" as const },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      update: {
        price: item.price,
        rarity: item.rarity,
        description: item.description,
        iconEmoji: item.iconEmoji,
        value: item.value,
        itemType: item.itemType,
      },
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
