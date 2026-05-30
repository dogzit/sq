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
  // ──────────────────────────────────────────
  // QUEST CATEGORIES  (with character class bonus mapping)
  // ──────────────────────────────────────────
  const categories = await Promise.all([
    prisma.questCategory.upsert({
      where: { name: "outdoor" },
      update: {},
      create: { name: "outdoor", emoji: "🏔️", description: "Physical & outdoor challenges", bonusClass: "TANK" },
    }),
    prisma.questCategory.upsert({
      where: { name: "fitness" },
      update: {},
      create: { name: "fitness", emoji: "💪", description: "Exercise & body challenges", bonusClass: "TANK" },
    }),
    prisma.questCategory.upsert({
      where: { name: "trivia" },
      update: {},
      create: { name: "trivia", emoji: "🧠", description: "Knowledge & brain teasers", bonusClass: "MAGE" },
    }),
    prisma.questCategory.upsert({
      where: { name: "funny" },
      update: {},
      create: { name: "funny", emoji: "😂", description: "Hilarious & embarrassing dares", bonusClass: "CLOWN" },
    }),
    prisma.questCategory.upsert({
      where: { name: "social" },
      update: {},
      create: { name: "social", emoji: "🤝", description: "Social interaction quests", bonusClass: "CLOWN" },
    }),
    prisma.questCategory.upsert({
      where: { name: "creative" },
      update: {},
      create: { name: "creative", emoji: "🎨", description: "Art & creative expression", bonusClass: null },
    }),
    prisma.questCategory.upsert({
      where: { name: "food" },
      update: {},
      create: { name: "food", emoji: "🍜", description: "Culinary adventures", bonusClass: null },
    }),
    prisma.questCategory.upsert({
      where: { name: "adventure" },
      update: {},
      create: { name: "adventure", emoji: "🗺️", description: "Explore the unknown", bonusClass: "TANK" },
    }),
  ]);

  const [outdoor, fitness, trivia, funny, social, creative, food, adventure] = categories;

  // ──────────────────────────────────────────
  // QUEST TEMPLATES
  // ──────────────────────────────────────────
  const templates = [
    // Outdoor / Fitness (TANK bonus)
    { title: "Sunrise Run", description: "Run 2km before 8 AM and snap the sunrise", xpReward: 100, difficulty: "HARD" as const, categoryId: outdoor.id },
    { title: "Park Bench Workout", description: "Do 20 push-ups on a park bench, photo proof required", xpReward: 60, difficulty: "MEDIUM" as const, categoryId: fitness.id },
    { title: "Cold Plunge", description: "Take a cold shower for 60 seconds — screenshot your timer", xpReward: 120, difficulty: "HARD" as const, categoryId: fitness.id },
    { title: "Stair Climber", description: "Find a building with 5+ floors and climb all stairs", xpReward: 80, difficulty: "MEDIUM" as const, categoryId: outdoor.id },
    { title: "Mountain Photo", description: "Hike to a viewpoint and take a panorama photo", xpReward: 200, difficulty: "LEGENDARY" as const, categoryId: outdoor.id },
    { title: "10K Steps", description: "Walk 10,000 steps today", xpReward: 80, difficulty: "MEDIUM" as const, categoryId: fitness.id },

    // Trivia (MAGE bonus)
    { title: "Wikipedia Rabbit Hole", description: "Learn 3 random facts and quiz your lobby", xpReward: 50, difficulty: "EASY" as const, categoryId: trivia.id },
    { title: "History Detective", description: "Find a historical monument in your city and share its story", xpReward: 90, difficulty: "MEDIUM" as const, categoryId: trivia.id },
    { title: "Code Challenge", description: "Solve a LeetCode Easy problem — screenshot the accepted solution", xpReward: 100, difficulty: "HARD" as const, categoryId: trivia.id },

    // Funny / Social (CLOWN bonus)
    { title: "Dad Joke Master", description: "Tell a dad joke to a stranger and photograph their reaction", xpReward: 80, difficulty: "MEDIUM" as const, categoryId: funny.id },
    { title: "Public Dance", description: "Dance in a public place for 15 seconds — video proof!", xpReward: 150, difficulty: "HARD" as const, categoryId: funny.id },
    { title: "Compliment Bomb", description: "Genuinely compliment 5 different strangers", xpReward: 70, difficulty: "MEDIUM" as const, categoryId: social.id },
    { title: "Stranger Selfie", description: "Ask a stranger to take a selfie with you", xpReward: 60, difficulty: "EASY" as const, categoryId: social.id },
    { title: "Accent Challenge", description: "Order coffee in a funny accent — film it", xpReward: 100, difficulty: "HARD" as const, categoryId: funny.id },
    { title: "Group Selfie", description: "Take a group photo with 3+ friends", xpReward: 50, difficulty: "EASY" as const, categoryId: social.id },

    // Creative
    { title: "Sidewalk Art", description: "Draw something with chalk on a sidewalk", xpReward: 70, difficulty: "MEDIUM" as const, categoryId: creative.id },
    { title: "Sunset Capture", description: "Photograph today's sunset with creative framing", xpReward: 40, difficulty: "EASY" as const, categoryId: creative.id },
    { title: "Street Art Hunt", description: "Find and photograph 3 different murals or street art", xpReward: 80, difficulty: "MEDIUM" as const, categoryId: creative.id },

    // Food
    { title: "Mystery Dish", description: "Order something you've never tried at a restaurant", xpReward: 60, difficulty: "EASY" as const, categoryId: food.id },
    { title: "Chef Mode", description: "Cook a dish from scratch using 5+ ingredients", xpReward: 90, difficulty: "MEDIUM" as const, categoryId: food.id },
    { title: "Food Art", description: "Plate your food in an Instagram-worthy way", xpReward: 50, difficulty: "EASY" as const, categoryId: food.id },

    // Adventure
    { title: "Hidden Gem", description: "Find a place in your city you've never visited before", xpReward: 100, difficulty: "HARD" as const, categoryId: adventure.id },
    { title: "Rooftop View", description: "Find the highest accessible point near you and take a photo", xpReward: 80, difficulty: "MEDIUM" as const, categoryId: adventure.id },
    { title: "Night Explorer", description: "Take a walk after 10 PM and photograph something interesting", xpReward: 70, difficulty: "MEDIUM" as const, categoryId: adventure.id },
  ];

  // Clear old templates and insert fresh
  await prisma.questTemplate.deleteMany({});
  for (const t of templates) {
    await prisma.questTemplate.create({ data: t });
  }

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

  console.log(`Seeded ${categories.length} categories`);
  console.log(`Seeded ${templates.length} quest templates`);
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
