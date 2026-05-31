import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
} from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY not configured");
}

const genAI = new GoogleGenerativeAI(apiKey);

export type DifficultyType = "EASY" | "MEDIUM" | "HARD" | "LEGENDARY";
export type BonusClassType = "TANK" | "MAGE" | "CLOWN" | "NONE";

export interface AiQuest {
  title: string;
  description: string;
  rewardXP: number;
  rewardCoins: number;
  difficulty: DifficultyType;
  bonusClass: BonusClassType;
}

// Шагналын хязгаарлалтыг нэг газар тодорхойлж өгснөөр Скэма болон Кламп зөрөхгүй
const REWARD_CONFIG = {
  EASY: { xp: [30, 60], coin: [5, 15] },
  MEDIUM: { xp: [61, 100], coin: [16, 30] },
  HARD: { xp: [101, 180], coin: [31, 60] },
  LEGENDARY: { xp: [181, 300], coin: [61, 100] },
} as const;

const QUEST_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description:
        "Богино, сонирхолтой, монгол хэл дээрх quest нэр. Эхэндээ заавал тохирох 1 emoji-той байна. Максимум 30 тэмдэгт.",
    },
    description: {
      type: SchemaType.STRING,
      description:
        "Quest-ийг хэрхэн биелүүлэх тухай урам зориг өгсөн тайлбар. 1-2 өгүүлбэр, монгол хэлээр.",
    },
    rewardXP: {
      type: SchemaType.INTEGER,
      description: `Шагналын XP оноо. Difficulty-ээс хамаарч дараах мужид байна: EASY: 30-60, MEDIUM: 61-100, HARD: 101-180, LEGENDARY: 181-300`,
    },
    rewardCoins: {
      type: SchemaType.INTEGER,
      description: `Шагналын Coin тоо. Difficulty-ээс хамаарч дараах мужид байна: EASY: 5-15, MEDIUM: 16-30, HARD: 31-60, LEGENDARY: 61-100`,
    },
    difficulty: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["EASY", "MEDIUM", "HARD", "LEGENDARY"],
      description: "Quest-ийн хүндрэлийн зэрэг",
    },
    bonusClass: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["TANK", "MAGE", "CLOWN", "NONE"],
      description:
        "Quest-ийн агуулгад тохирох character class. TANK = бие/гадаа/спорт, MAGE = мэдлэг/тоо бодлого/уншлага, CLOWN = инээдтэй/нийгмийн. Аль нь ч тохирохгүй бол NONE.",
    },
  },
  required: ["title", "description", "rewardXP", "rewardCoins", "difficulty", "bonusClass"],
};

const SYSTEM_PROMPT = `Чи бол SideQuest аппын өдөр тутмах даалгавар (quest) үүсгэгч AI систем юм.

Даалгавар үүсгэх дүрэм:
1. Тухайн өгөгдсөн сэдэвт тохирсон, бодит амьдрал дээр биелүүлэх боломжтой, зураг авч баталгаажуулж болохуйц эрүүл бөгөөд аюулгүй даалгавар үүсгэ.
2. Архи, тамхи, мансууруулах бодис, замын хөдөлгөөнд саад учруулах болон хувийн мэдээлэл ил болгох эрсдэлтэй зүйлсийг ОР ТАС ХОРИГЛОНО.
3. Оролтоор ирэх хүндрэлийн зэрэгт (difficulty) тохируулан rewardXP болон rewardCoins-ийг хуваарил.
4. bonusClass-ийг даалгаврын мөн чанарт нийцүүлэн сонго:
   - TANK → биеийн тамир, гадаа явах, гүйх, ачаалал.
   - MAGE → мэдлэг, унших, бодох, асуулт хариулт.
   - CLOWN → инээдтэй, нийгмийн харилцаа, шууд хүмүүстэй харьцах.
   - NONE → дээрх ангилалд тодорхой багтахгүй (бүтээлч, хоол, аялал гэх мэт).`;

export async function generateAiQuest(seed?: string): Promise<AiQuest> {
  const userMessage = seed
    ? `Сэдэв: "${seed}". Энэ сэдэвтэй холбоотой, зуны уур амьсгалтай сонирхолтой daily quest үүсгэ.`
    : "Зуны сонирхолтой, шинэ daily quest үүсгэ.";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: QUEST_SCHEMA,
      temperature: 1.0, // Олон янзын квест үүсгэхийн тулд 1.0 байлгасан нь зөв
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

  const VALID_BONUS: BonusClassType[] = ["TANK", "MAGE", "CLOWN", "NONE"];
  if (
    !parsed.title ||
    !parsed.description ||
    typeof parsed.rewardXP !== "number" ||
    typeof parsed.rewardCoins !== "number" ||
    !REWARD_CONFIG[parsed.difficulty] ||
    !VALID_BONUS.includes(parsed.bonusClass)
  ) {
    throw new Error("AI returned malformed quest fields");
  }

  // Шагналын оноог REWARD_CONFIG-ийн дагуу найдвартай clamp хийх
  const config = REWARD_CONFIG[parsed.difficulty];
  parsed.rewardXP = Math.min(
    Math.max(parsed.rewardXP, config.xp[0]),
    config.xp[1],
  );
  parsed.rewardCoins = Math.min(
    Math.max(parsed.rewardCoins, config.coin[0]),
    config.coin[1],
  );

  return parsed;
}

const SEED_THEMES = [
  "Биеийн тамир",
  "Гэрэл зураг",
  "Ном унших",
  "Шинэ хоол",
  "Нийгмийн харилцаа",
  "Байгальд явах",
  "Бүтээлч зүйл",
  "Хөгжим",
  "Тоглоом",
  "Гэр бүл",
  "Найзууд",
  "Аялал",
];

export async function generateDailyQuestBatch(
  count: number,
): Promise<AiQuest[]> {
  const shuffled = [...SEED_THEMES]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  const promises = shuffled.map((seed) =>
    generateAiQuest(seed).catch((err) => {
      console.error(`AI quest failed for seed "${seed}":`, err);
      return null;
    }),
  );

  const results = await Promise.all(promises);
  return results.filter((q): q is AiQuest => q !== null);
}
