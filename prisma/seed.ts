import "dotenv/config";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool as any);
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
  // SHOP ITEMS
  // ──────────────────────────────────────────
  const shopItems = [
    // Titles
    { name: "Quest Master", description: "The legendary neon title for true questers", price: 500, itemType: "TITLE" as const, value: "Quest Master", iconEmoji: "👑" },
    { name: "Shadow Walker", description: "A mysterious dark title", price: 400, itemType: "TITLE" as const, value: "Shadow Walker", iconEmoji: "🌑" },
    { name: "Neon God", description: "The ultimate cyberpunk flex", price: 1000, itemType: "TITLE" as const, value: "Neon God", iconEmoji: "⚡" },
    { name: "Pixel Warrior", description: "Old school gamer vibes", price: 300, itemType: "TITLE" as const, value: "Pixel Warrior", iconEmoji: "🎮" },
    { name: "Meme Lord", description: "For the funniest in the lobby", price: 350, itemType: "TITLE" as const, value: "Meme Lord", iconEmoji: "😎" },
    { name: "Trailblazer", description: "First to complete every quest", price: 600, itemType: "TITLE" as const, value: "Trailblazer", iconEmoji: "🔥" },

    // Buffs
    { name: "Ивээх (Bless)", description: "Grant a friend +25% XP on their next quest", price: 200, itemType: "BUFF" as const, value: "1.25", iconEmoji: "✨" },
    { name: "Double Blessing", description: "Grant a friend +50% XP on their next quest", price: 450, itemType: "BUFF" as const, value: "1.50", iconEmoji: "🌟" },

    // Debuffs
    { name: "Хараах (Curse)", description: "Reduce an enemy's next quest XP by 25%", price: 250, itemType: "DEBUFF" as const, value: "0.75", iconEmoji: "💀" },
    { name: "Heavy Curse", description: "Reduce an enemy's next quest XP by 50%", price: 500, itemType: "DEBUFF" as const, value: "0.50", iconEmoji: "☠️" },
  ];

  for (const item of shopItems) {
    await prisma.shopItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }

  console.log(`✓ Seeded ${categories.length} categories`);
  console.log(`✓ Seeded ${templates.length} quest templates`);
  console.log(`✓ Seeded ${shopItems.length} shop items`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
