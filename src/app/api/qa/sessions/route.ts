import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { sessionCreateSchema } from "@/lib/validations";
import type { GameType } from "@/generated/prisma/client";

const triviaBank = [
  // Ерөнхий мэдлэг
  { question: "Дэлхийн хамгийн өндөр уул юу вэ?", options: ["K2", "Everest", "Kangchenjunga", "Lhotse"], correctIndex: 1 },
  { question: "Нарны аймгийн хамгийн том гараг юу вэ?", options: ["Saturn", "Jupiter", "Neptune", "Uranus"], correctIndex: 1 },
  { question: "Монгол улсын нийслэл юу вэ?", options: ["Дархан", "Эрдэнэт", "Улаанбаатар", "Чойбалсан"], correctIndex: 2 },
  { question: "Усны химийн томъёо юу вэ?", options: ["CO2", "H2O", "O2", "NaCl"], correctIndex: 1 },
  { question: "1 км = хэдэн метр?", options: ["100", "500", "1000", "10000"], correctIndex: 2 },
  { question: "Дэлхийн хамгийн том далай юу вэ?", options: ["Атлантик", "Номхон", "Энэтхэг", "Хойд мөсөн"], correctIndex: 1 },
  { question: "Хүний биед хэдэн яс байдаг вэ?", options: ["106", "206", "306", "156"], correctIndex: 1 },
  { question: "Нар дэлхийгээс хэдэн гэрлийн минутын зайтай вэ?", options: ["4", "8", "12", "20"], correctIndex: 1 },
  { question: "Дэлхийн хамгийн урт гол юу вэ?", options: ["Амазон", "Нил", "Миссисипи", "Янцзы"], correctIndex: 1 },
  { question: "Хүний биеийн хэдэн хувь нь ус вэ?", options: ["40%", "50%", "60%", "70%"], correctIndex: 2 },
  { question: "Алмаз ямар элементээс бүтдэг вэ?", options: ["Төмөр", "Нүүрстөрөгч", "Кальци", "Цахиур"], correctIndex: 1 },
  { question: "Монголын хамгийн урт гол юу вэ?", options: ["Туул", "Орхон", "Сэлэнгэ", "Херлэн"], correctIndex: 3 },
  { question: "Дэлхий дээр хэдэн тив байдаг вэ?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { question: "Хамгийн хурдан амьтан юу вэ?", options: ["Арслан", "Цагаан барс", "Шонхор", "Гепард"], correctIndex: 2 },
  { question: "Сарнай хэдэн зуунд Монголд анх ургуулсан бэ?", options: ["17", "18", "19", "20"], correctIndex: 2 },
  { question: "Дэлхийн хүн амын хэдэн хувь нь Ази тивд амьдардаг вэ?", options: ["30%", "45%", "60%", "75%"], correctIndex: 2 },
  { question: "Марс гаргийн өнгө юу вэ?", options: ["Цэнхэр", "Шар", "Улаан", "Ногоон"], correctIndex: 2 },
  { question: "Далайн ус яагаад давстай байдаг вэ?", options: ["Загаснаас", "Голын эрдсээс", "Нарнаас", "Агаараас"], correctIndex: 1 },
  { question: "Египтийн Пирамидыг хэдэн жилийн өмнө барьсан бэ?", options: ["2000", "3000", "4500", "6000"], correctIndex: 2 },
  { question: "Дэлхий нарыг хэдэн хоногт тойрдог вэ?", options: ["360", "365", "370", "355"], correctIndex: 1 },

  // Технологи
  { question: "HTML гэдэг юуны товчлол вэ?", options: ["HyperText Markup Language", "High Tech ML", "Home Tool ML", "HyperTransfer ML"], correctIndex: 0 },
  { question: "JavaScript-ийг хэн зохиосон бэ?", options: ["Guido van Rossum", "James Gosling", "Brendan Eich", "Dennis Ritchie"], correctIndex: 2 },
  { question: "React-ийг аль компани хөгжүүлсэн бэ?", options: ["Google", "Apple", "Facebook", "Microsoft"], correctIndex: 2 },
  { question: "CSS гэдэг юуны товчлол вэ?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Sheets"], correctIndex: 1 },
  { question: "Python хэлийг хэн зохиосон бэ?", options: ["Guido van Rossum", "Linus Torvalds", "Tim Berners-Lee", "James Gosling"], correctIndex: 0 },
  { question: "Интернэтийг хэдэн онд зохион бүтээсэн бэ?", options: ["1969", "1975", "1983", "1991"], correctIndex: 0 },
  { question: "Git-ийг хэн зохиосон бэ?", options: ["Bill Gates", "Linus Torvalds", "Steve Jobs", "Mark Zuckerberg"], correctIndex: 1 },
  { question: "SQL гэдэг юуны товчлол вэ?", options: ["Structured Query Language", "Simple Question Language", "System Query Logic", "Standard Query Line"], correctIndex: 0 },
  { question: "Хамгийн анхны компьютер аль нь вэ?", options: ["IBM PC", "Apple I", "ENIAC", "Commodore 64"], correctIndex: 2 },
  { question: "1 байт = хэдэн бит?", options: ["4", "8", "16", "32"], correctIndex: 1 },
  { question: "Linux-ийн маскот амьтан юу вэ?", options: ["Нохой", "Оцон шувуу", "Муур", "Арслан"], correctIndex: 1 },
  { question: "TypeScript-ийг аль компани хөгжүүлсэн бэ?", options: ["Google", "Facebook", "Microsoft", "Amazon"], correctIndex: 2 },
  { question: "HTTP гэдэг юуны товчлол вэ?", options: ["HyperText Transfer Protocol", "High Tech Transfer Protocol", "Home Transfer Program", "Hybrid Text Protocol"], correctIndex: 0 },
  { question: "API гэдэг юуны товчлол вэ?", options: ["Application Programming Interface", "Advanced Protocol Integration", "Auto Program Input", "App Process Integration"], correctIndex: 0 },
  { question: "GitHub-ийг аль компани худалдаж авсан бэ?", options: ["Google", "Amazon", "Microsoft", "Apple"], correctIndex: 2 },

  // Монгол
  { question: "Чингис хаан хэдэн онд төрсөн бэ?", options: ["1142", "1162", "1182", "1202"], correctIndex: 1 },
  { question: "Монгол улсын талбай хэдэн мянган км²?", options: ["1064", "1267", "1564", "1867"], correctIndex: 2 },
  { question: "Монголын хамгийн өндөр уул юу вэ?", options: ["Отгонтэнгэр", "Хүйтэн", "Мөнх Хайрхан", "Тавн Богд"], correctIndex: 1 },
  { question: "Монгол бичгийг хэн зохиосон бэ?", options: ["Тататунга", "Занабазар", "Бямбын Ринчен", "Чойжинжав"], correctIndex: 0 },
  { question: "Монголын төгрөгний валютын код юу вэ?", options: ["MON", "MGL", "MNT", "MGT"], correctIndex: 2 },
  { question: "Монгол улсад хэдэн аймаг байдаг вэ?", options: ["18", "19", "21", "23"], correctIndex: 2 },
  { question: "Наадмын хэдэн нэрт тоглоом байдаг вэ?", options: ["2", "3", "4", "5"], correctIndex: 1 },
  { question: "Монголын хамгийн том нуур юу вэ?", options: ["Хөвсгөл", "Увс", "Хяргас", "Буйр"], correctIndex: 1 },
  { question: "Монгол улс хэдэн онд тусгаар тогтносон бэ?", options: ["1911", "1921", "1924", "1945"], correctIndex: 0 },
  { question: "Хөвсгөл нуур дэлхийд хэддүгээр том цэвэр усны нуур вэ?", options: ["2", "5", "8", "14"], correctIndex: 0 },

  // Поп соёл
  { question: "Harry Potter-ийн зохиогч хэн бэ?", options: ["Stephen King", "J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin"], correctIndex: 2 },
  { question: "Marvel-ийн Тор аль улсын домогт гардаг вэ?", options: ["Грек", "Египт", "Хойд Европ", "Япон"], correctIndex: 2 },
  { question: "Mario тоглоомын дүрийн мэргэжил юу вэ?", options: ["Барилгачин", "Сантехникч", "Цагдаа", "Тогооч"], correctIndex: 1 },
  { question: "Spotify хэдэн онд үүссэн бэ?", options: ["2004", "2006", "2008", "2010"], correctIndex: 1 },
  { question: "Tesla компанийг хэн үүсгэн байгуулсан бэ?", options: ["Elon Musk", "Martin Eberhard", "Jeff Bezos", "Steve Wozniak"], correctIndex: 1 },
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = sessionCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  const { lobbyId, gameType = "TRIVIA", roundCount = 5 } = parsed.data;

  // Verify membership
  const member = await prisma.lobbyMember.findUnique({
    where: { userId_lobbyId: { userId: user.id, lobbyId } },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  // Pick random questions
  const shuffled = [...triviaBank].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(roundCount, shuffled.length));

  const session = await prisma.qASession.create({
    data: {
      gameType: gameType as GameType,
      roundCount: selected.length,
      lobbyId,
      questions: {
        create: selected.map((q, i) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          round: i + 1,
        })),
      },
    },
    include: {
      questions: { orderBy: { round: "asc" } },
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lobbyId = searchParams.get("lobbyId");
  const sessionId = searchParams.get("sessionId");

  // Fetch single session by ID
  if (sessionId) {
    const session = await prisma.qASession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { orderBy: { round: "asc" } },
      },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    return NextResponse.json({ session });
  }

  if (!lobbyId) return NextResponse.json({ error: "Lobby ID required" }, { status: 400 });

  const sessions = await prisma.qASession.findMany({
    where: { lobbyId },
    include: {
      questions: {
        include: { _count: { select: { answers: true } } },
        orderBy: { round: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ sessions });
}
