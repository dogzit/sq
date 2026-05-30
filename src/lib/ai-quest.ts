import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface AiQuest {
  title: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
}

const QUEST_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: "Богино, сэдэвтэй, монгол хэл дээрх quest нэр. 30 тэмдэгтээс хэтрэхгүй. Эхэндээ emoji.",
    },
    description: {
      type: SchemaType.STRING,
      description: "Quest-ийг хэрхэн биелүүлэх тайлбар. 1-2 өгүүлбэр, монгол хэлээр.",
    },
    rewardXP: {
      type: SchemaType.INTEGER,
      description: "XP шагнал. EASY: 30-60, MEDIUM: 60-100, HARD: 100-180, LEGENDARY: 180-300",
    },
    rewardCoins: {
      type: SchemaType.INTEGER,
      description: "Coin шагнал. EASY: 5-15, MEDIUM: 15-30, HARD: 30-60, LEGENDARY: 60-100",
    },
    difficulty: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["EASY", "MEDIUM", "HARD", "LEGENDARY"],
      description: "Quest-ийн хүндрэлийн зэрэг",
    },
  },
  required: ["title", "description", "rewardXP", "rewardCoins", "difficulty"],
};

const SYSTEM_PROMPT = `Чи бол SideQuest аппын өдөр тутмын даалгавар (quest) үүсгэгч AI юм.

Дүрэм:
- Зуны сэдэвтэй, бодит амьдрал дээр хийх боломжтой, эрүүл, аюулгүй даалгавар үүсгэ.
- Жишээ: "Нар мандахыг хараад зураг ав", "30 минут ном унш", "Шинэ хүнтэй танилц", "Гадаа 5км алх".
- Title-г сонирхолтой, эхэнд emoji-той бич (жнь "🌅 Нарны мэндчилгээ").
- Description нь товч бөгөөд тодорхой.
- rewardXP, rewardCoins-ийг difficulty-тэй уялдуулна.
- Зөвхөн JSON буцаа.`;

export async function generateAiQuest(seed?: string): Promise<AiQuest> {
  const userMessage = seed
    ? `Сэдэв: "${seed}". Энэ сэдэвтэй холбоотой quest үүсгэ.`
    : "Зуны сонирхолтой шинэ daily quest үүсгэ.";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: QUEST_SCHEMA,
      temperature: 1.0,
    },
  });

  const result = await model.generateContent(userMessage);
  const text = result.response.text();

  let parsed: AiQuest;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`AI returned invalid JSON: ${text.slice(0, 200)}`);
  }

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.description !== "string" ||
    typeof parsed.rewardXP !== "number" ||
    typeof parsed.rewardCoins !== "number" ||
    !["EASY", "MEDIUM", "HARD", "LEGENDARY"].includes(parsed.difficulty)
  ) {
    throw new Error("AI returned malformed quest fields");
  }

  // Clamp rewards to safe ranges per difficulty
  const clamps = {
    EASY:      { xp: [20, 80],  coin: [3, 20] },
    MEDIUM:    { xp: [50, 130], coin: [10, 40] },
    HARD:      { xp: [100, 220], coin: [25, 80] },
    LEGENDARY: { xp: [180, 350], coin: [50, 150] },
  } as const;
  const c = clamps[parsed.difficulty];
  parsed.rewardXP    = Math.min(Math.max(parsed.rewardXP, c.xp[0]),   c.xp[1]);
  parsed.rewardCoins = Math.min(Math.max(parsed.rewardCoins, c.coin[0]), c.coin[1]);

  return parsed;
}

const SEED_THEMES = [
  "Биеийн тамир", "Гэрэл зураг", "Ном унших", "Шинэ хоол",
  "Нийгмийн харилцаа", "Байгальд явах", "Бүтээлч зүйл",
  "Хөгжим", "Тоглоом", "Гэр бүл", "Найзууд", "Аялал",
];

export async function generateDailyQuestBatch(count: number): Promise<AiQuest[]> {
  const shuffled = [...SEED_THEMES].sort(() => Math.random() - 0.5).slice(0, count);
  const promises = shuffled.map((seed) =>
    generateAiQuest(seed).catch((err) => {
      console.error(`AI quest failed for seed "${seed}":`, err);
      return null;
    })
  );
  const results = await Promise.all(promises);
  return results.filter((q): q is AiQuest => q !== null);
}
