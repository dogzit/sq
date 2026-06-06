import type { Metadata } from "next";
import Link from "next/link";
import HelpToc, { type TocSection } from "./HelpToc";
import HelpProgress from "./HelpProgress";

export const metadata: Metadata = {
  title: "Help · SideQuest Manual",
  description:
    "SideQuest апп-ын бүх боломж — Lobby, Quest, Trivia, Shop, Push-ups, Achievements, Games, Map, Streak зэргийн бүрэн гарын авлага.",
  robots: { index: false, follow: false },
};

const sections: TocSection[] = [
  // ── Getting started
  { id: "overview", emoji: "🌌", title: "SideQuest гэж юу вэ?", hint: "Гол санаа, тоглоомын loop", group: "Эхлэх" },
  { id: "quickref", emoji: "⚡", title: "Quick Reference", hint: "Cheat-sheet (1 минут)", group: "Эхлэх" },
  { id: "account", emoji: "🆔", title: "Бүртгэл & Профайл", hint: "Бүртгэл, нэвтрэх, нүүр зураг", group: "Эхлэх" },
  { id: "xp-coin-level", emoji: "⚡", title: "XP, Coin, Level", hint: "Эдийн засгийн систем", group: "Эхлэх" },

  // ── Core gameplay
  { id: "lobby", emoji: "👥", title: "Lobby (Party)", hint: "Найзуудтайгаа нэгдэх", group: "Гол тоглолт" },
  { id: "class", emoji: "🛡️", title: "Character Class", hint: "TANK · MAGE · CLOWN", group: "Гол тоглолт" },
  { id: "quests", emoji: "🎯", title: "Quest систем", hint: "Daily, Emergency, AI", group: "Гол тоглолт" },
  { id: "submission", emoji: "📸", title: "Submission & Veto", hint: "Photo-proof, EXIF, санал", group: "Гол тоглолт" },
  { id: "comments", emoji: "💬", title: "Submission Comments", hint: "Reaction, маргаан", group: "Гол тоглолт" },
  { id: "create-quest", emoji: "✍️", title: "Өөрөө quest үүсгэх", hint: "Хэрэглэгчийн quest", group: "Гол тоглолт" },

  // ── Daily loop
  { id: "checkin", emoji: "🎁", title: "Daily Check-In & Streak", hint: "Өдөр бүр шагнал", group: "Өдөр тутам" },
  { id: "streak-recover", emoji: "🔥", title: "Streak Recovery", hint: "Алдсан streak-аа сэргээ", group: "Өдөр тутам" },
  { id: "safe-mode", emoji: "🏕️", title: "Camping (Safe Mode)", hint: "Streak царцаах", group: "Өдөр тутам" },
  { id: "trivia", emoji: "🧠", title: "Trivia", hint: "Асуулт хариулах", group: "Өдөр тутам" },
  { id: "pushups", emoji: "💪", title: "AI Push-up Challenge", hint: "Камераар тоолох", group: "Өдөр тутам" },

  // ── Economy & cosmetics
  { id: "shop", emoji: "🛍️", title: "Shop & Inventory", hint: "Coin-оор худалдан авах", group: "Эдийн засаг" },
  { id: "effects", emoji: "✨", title: "Buff & Debuff", hint: "Найзыг өргөх / дайсныг хараах", group: "Эдийн засаг" },
  { id: "frames-titles", emoji: "🖼️", title: "Avatar Frame & Title", hint: "Хувийн загвар", group: "Эдийн засаг" },
  { id: "achievements", emoji: "🏆", title: "Achievements", hint: "Шагнал авах", group: "Эдийн засаг" },
  { id: "economy", emoji: "💱", title: "Economy Cheat Sheet", hint: "Үнэ, шагналын хүснэгт", group: "Эдийн засаг" },

  // ── Social
  { id: "games", emoji: "🎮", title: "Mini-Games (Betting)", hint: "RPS, TTT, Coin Flip", group: "Social" },
  { id: "friends", emoji: "🤝", title: "Найз нэмэх", hint: "Friendship систем", group: "Social" },
  { id: "feed", emoji: "📡", title: "Найзуудын Feed", hint: "Live идэвхжил", group: "Social" },
  { id: "map", emoji: "🗺️", title: "Snapchat-style Live Map", hint: "Real-time байршил", group: "Social" },
  { id: "leaderboard", emoji: "📊", title: "Leaderboard", hint: "Global XP ranking", group: "Social" },
  { id: "chat", emoji: "💭", title: "Lobby Chat", hint: "Real-time чат", group: "Social" },

  // ── Records
  { id: "history", emoji: "📚", title: "Submission History", hint: "Өнгөрсөн оролдлогууд", group: "Бичлэг" },
  { id: "albums", emoji: "🖼️", title: "Album & Video", hint: "Дурсамж эмхэтгэх", group: "Бичлэг" },
  { id: "notifications", emoji: "🔔", title: "Notifications & Push", hint: "Сэрэмжлүүлэг", group: "Бичлэг" },

  // ── Other
  { id: "birthday", emoji: "🎂", title: "Birthday Popup", hint: "Төрсөн өдрийн бэлэг", group: "Бусад" },
  { id: "pwa", emoji: "📱", title: "PWA & Суулгах", hint: "Утсандаа суулгах", group: "Бусад" },
  { id: "admin", emoji: "🛠️", title: "Admin Panel", hint: "Зөвхөн admin-д", group: "Бусад" },

  // ── Productive use
  { id: "tips", emoji: "🚀", title: "Pro Tips", hint: "Туршлагатай хэрэглэгчийн зөвлөгөө", group: "Туслах" },
  { id: "glossary", emoji: "📖", title: "Glossary", hint: "Үг хэллэгийн тайлбар", group: "Туслах" },
  { id: "troubleshoot", emoji: "🩹", title: "Troubleshooting", hint: "Алдаа гарвал юу хийх вэ?", group: "Туслах" },
  { id: "privacy", emoji: "🔒", title: "Privacy & Data", hint: "Таны мэдээлэл хэрхэн хадгалагдах вэ?", group: "Туслах" },
  { id: "changelog", emoji: "📝", title: "Changelog", hint: "Шинэ боломжууд", group: "Туслах" },
  { id: "faq", emoji: "❓", title: "FAQ", hint: "Түгээмэл асуулт", group: "Туслах" },
];

export default function HelpPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <HelpProgress />

      {/* Decorative gradient backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-neon-purple/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-neon-blue/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-neon-gold/5 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* ─────── HERO ─────── */}
        <header className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-[11px] uppercase tracking-widest font-semibold text-neon-purple">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse" /> Manual · v1
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-neon-purple via-neon-blue to-neon-gold bg-clip-text text-transparent">
              SideQuest
            </span>
            <span className="block text-2xl sm:text-3xl text-muted-foreground font-semibold mt-2">
              Бүх боломжийн гарын авлага
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Энэ нь нийтэд харагдахгүй <span className="font-mono text-foreground">/help</span> хуудас.
            Доор апп-ын <strong className="text-foreground">бүхий л боломж</strong>, тэдгээрийн <em>зорилго</em>,{" "}
            <em>ажиллах зарчим</em>, <em>шагнал</em> нарийвчилсан байдлаар тайлбарласан.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link
              href="/dashboard"
              className="text-xs px-4 py-2 rounded-full bg-neon-purple text-white font-semibold hover:bg-neon-purple/90 transition-all"
            >
              ← Dashboard руу буцах
            </Link>
            <a
              href="#overview"
              className="text-xs px-4 py-2 rounded-full bg-secondary text-foreground font-semibold hover:bg-secondary/70 transition-all"
            >
              Манифестыг уншиж эхлэх ↓
            </a>
          </div>
        </header>

        {/* ─────── TABLE OF CONTENTS (search + grouped) ─────── */}
        <nav className="mb-16">
          <HelpToc sections={sections} />
        </nav>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTIONS */}
        {/* ═══════════════════════════════════════════ */}

        <Section id="quickref" emoji="⚡" title="Quick Reference — 1 минутын товч">
          <p>
            Анх нэвтэрсэн хэрэглэгчдэд зориулсан <strong>шахмал тойм</strong>. Дэлгэрэнгүйг доош scroll хийж уншина уу.
          </p>
          <Grid2>
            <FeatureCard emoji="1️⃣" title="Lobby үүсгэх">
              Найзуудтайгаа <Link href="/lobbies" className="link">Party</Link> хийгээд 6 оронтой код хуваалцана.
            </FeatureCard>
            <FeatureCard emoji="2️⃣" title="Quest гаргах">
              Lobby дотор <em>“Үүсгэх”</em> товч → AI өдрийн challenge-ыг танд тарааж өгнө.
            </FeatureCard>
            <FeatureCard emoji="3️⃣" title="Зураг илгээх">
              Quest-ийг биелүүлээд <strong>тухайн өдрийн</strong> зурагтай submission илгээ. EXIF шалгана.
            </FeatureCard>
            <FeatureCard emoji="4️⃣" title="Veto хүлээх">
              Lobby-н бусад гишүүд approve / reject санал өгнө.
            </FeatureCard>
            <FeatureCard emoji="5️⃣" title="XP & Coin авах">
              Approve болсон даруйд шагнал орно. Streak-ээ хадгал.
            </FeatureCard>
            <FeatureCard emoji="6️⃣" title="Coin-оо зарцуулах">
              <Link href="/shop" className="link">Shop</Link>-оос frame, buff, reroll, title худалдан ав.
            </FeatureCard>
          </Grid2>
          <Callout tone="success">
            <strong>Үндсэн KPI:</strong> Daily check-in × Quest approve × Streak — энэ гурвыг тогтмол хадгалбал
            Leaderboard-ийн дээгүүр гарах боломжтой.
          </Callout>
        </Section>

        <Section id="overview" emoji="🌌" title="SideQuest гэж юу вэ?">
          <p>
            SideQuest бол <strong>амьдрал дээрх RPG</strong>. Найзуудтайгаа{" "}
            <Link href="/lobbies" className="link">Lobby (Party)</Link> үүсгэж, өдөр бүр AI-аар үүсгэгдсэн real-life
            <em> sidequest</em> биелүүлж, <strong>photo-proof</strong> илгээж, бусдын саналаар батлуулж XP/Coin олдог.
          </p>
          <Loop />
          <KVList>
            <KV label="Платформ">Web-first PWA (iOS/Android суулгах боломжтой)</KV>
            <KV label="Цөм механик">Quest → Submission → Veto vote → XP/Coin</KV>
            <KV label="Эдийн засаг">Coin = худалдан авах эрх, XP = level/ranking</KV>
            <KV label="Social loop">Lobby chat, Feed, Buff/Debuff, Games, Friend system</KV>
          </KVList>
        </Section>

        <Section id="account" emoji="🆔" title="Бүртгэл & Профайл">
          <p>
            <Link href="/register" className="link">Register</Link>-ээр email + нууц үгээр шинээр бүртгүүл. Email-ийн
            verification (magic link/OTP) болсны дараа дотогш орно. Дараа нь{" "}
            <Link href="/profile" className="link">Profile</Link>-аас:
          </p>
          <ul className="list-bullets">
            <li><strong>Avatar</strong> — Cloudinary upload, нүүрний зургаа сонго</li>
            <li><strong>Display Name / Bio</strong> — өөрийн товч танилцуулга</li>
            <li><strong>Birthday</strong> — оруулбал төрсөн өдөр Birthday popup идэвхждэг</li>
            <li><strong>Interests</strong> — Quest AI таны сонирхолд тааруулж quest үүсгэнэ</li>
            <li><strong>Equipped Frame</strong> — Shop-оос авсан avatar frame зүүх</li>
            <li><strong>Custom Title</strong> — lobby-д харагдах neon title (lobby тус бүрт)</li>
          </ul>
          <Callout tone="info">
            Бүртгэл дуусаагүй (нүүр/нэр/төрсөн өдөр дутуу) бол <strong>ProfileCompleteModal</strong> гарч ирж
            анхааруулна. Заавал нөхвөл Daily Check-in, Quest зэрэгтэй холбоотой шагнал боломжтой.
          </Callout>
        </Section>

        <Section id="xp-coin-level" emoji="⚡" title="XP, Coin, Level систем">
          <p>Хоёр үндсэн valyut байдаг — <strong>XP</strong> ба <strong>Coin (🪙)</strong>.</p>
          <Grid2>
            <Stat label="XP" value="⚡" desc="Level дээшилнэ. Leaderboard rank-ийн үндэс. XP буцааж зарцуулдаггүй." />
            <Stat label="Coin" value="🪙" desc="Shop-д худалдан авна. Mini-game-д bet хийнэ. Streak сэргээх, Safe Mode идэвхжүүлнэ." />
          </Grid2>
          <h4 className="sub">Level томъёо</h4>
          <p>
            <code className="kbd">xpForLevel(n)</code> функц нь дараагийн level-д шаардлагатай XP-ийг тооцоолно. Level
            дээшлэх тусам шаардлага өсдөг (exponential growth). Dashboard дээр{" "}
            <code className="kbd">XP progress bar</code> + <em>“X XP to Level Y”</em> харагдана.
          </p>
          <h4 className="sub">Streak Multiplier</h4>
          <p>
            <code className="kbd">+min(streak, 30)% XP</code> урамшуулал — өдрийн check-in алдалгүй явсан өдрүүд тус бүрд
            +1% (хамгийн ихдээ +30%) XP илүү авна.
          </p>
          <h4 className="sub">Class bonus</h4>
          <p>
            AI quest-д <em>bonus class</em> тэмдэглэгдвэл тухайн class-тай хэрэглэгч <strong>+25% XP</strong> авна
            (Tank/Mage/Clown).
          </p>
        </Section>

        <Section id="lobby" emoji="👥" title="Lobby (Party)">
          <p>
            <Link href="/lobbies" className="link">Lobby</Link> бол найзуудын жижиг бүлгэм. Quest, location, chat бүгд
            lobby-н хүрээнд явагдана. Та <strong>олон lobby</strong>-д зэрэг гишүүн байж болно.
          </p>
          <Grid2>
            <FeatureCard emoji="🆕" title="Create Lobby">
              Нэр өг → 6 оронтой <strong>invite code</strong> үүснэ. Та автоматаар <em>Owner</em> болно. Max 10 гишүүн (default).
            </FeatureCard>
            <FeatureCard emoji="🔑" title="Join by Code">
              Найзынхаа кодыг оруулж шууд ороорой. Эсвэл lobby owner шууд <strong>username-аар урих</strong> боломжтой.
            </FeatureCard>
            <FeatureCard emoji="💌" title="Invite">
              Хүлээгдэж буй урилгууд <code className="kbd">/lobbies</code> дээр харагдана. Accept / Decline.
            </FeatureCard>
            <FeatureCard emoji="👑" title="Roles">
              <strong>Owner</strong> · <strong>Member</strong>. Owner лобби нэр өөрчлөх, гишүүн хасах, quest үүсгэх эрхтэй.
            </FeatureCard>
          </Grid2>
          <Callout tone="warn">
            Lobby устгасан тохиолдолд тус lobby-н бүх Quest, Invite, Chat мессеж <em>cascade</em>-ээр устдаг (онцлог!).
          </Callout>
        </Section>

        <Section id="class" emoji="🛡️" title="Character Class">
          <p>Lobby тус бүрт өөр class сонгож болно. Class тус бүр өөрийн төрлийн quest дээр +25% XP боносоо.</p>
          <Grid3>
            <ClassCard
              name="TANK"
              emoji="🛡️"
              color="text-neon-blue"
              bg="bg-neon-blue/10"
              bonus="Outdoor / Fitness"
              desc="Гадаа гарах, биеийн тамирын даалгавар амжилттай биелүүлбэл XP илүү. Аян, спорт, эрчим хүчтэй challenge-д."
            />
            <ClassCard
              name="MAGE"
              emoji="🔮"
              color="text-neon-purple"
              bg="bg-neon-purple/10"
              bonus="Trivia / Q&A"
              desc="Оюуны даалгавар, асуулт хариулт, унших / судлахтай холбоотой quest-д давуу талтай."
            />
            <ClassCard
              name="CLOWN"
              emoji="🤡"
              color="text-neon-pink"
              bg="bg-neon-pink/10"
              bonus="Funny / Social"
              desc="Social pranks, хошин видео, найз нөхдөө инээлгэх quest-ийн чемпион."
            />
          </Grid3>
        </Section>

        <Section id="quests" emoji="🎯" title="Quest систем">
          <p>
            Quest бол <strong>биелүүлэх ёстой даалгавар</strong>. Тал бүрийн төрөл, хүндрэлийн зэрэг, дуусах хугацаатай.
          </p>
          <h4 className="sub">Quest type</h4>
          <Grid2>
            <FeatureCard emoji="📅" title="DAILY">
              Энгийн өдрийн quest. Lobby дотор AI-аар үүсгэнэ. Ихэвчлэн 24 цагт дуусдаг.
            </FeatureCard>
            <FeatureCard emoji="🚨" title="EMERGENCY">
              <strong>15-минутын flash-mob</strong>. Өндөр XP. Цаг хугацаа бага учир бүх лобби хэн нь түрүүлэх вэ гэж яардаг.
            </FeatureCard>
          </Grid2>
          <h4 className="sub">Difficulty (XP base)</h4>
          <Grid2>
            <DiffPill name="EASY" desc="Энгийн өдрийн ажил" />
            <DiffPill name="MEDIUM" desc="Дунд зэрэг challenge" />
            <DiffPill name="HARD" desc="Хүчин чармайлт шаардлагатай" />
            <DiffPill name="LEGENDARY" desc="Маш ховор, өндөр XP" />
          </Grid2>
          <h4 className="sub">Хэрхэн үүсгэх</h4>
          <ol className="list-numbered">
            <li><Link href="/lobbies" className="link">Lobby</Link>-д ор</li>
            <li>“Quest үүсгэх” товч дар → AI таны class, interest-д тааруулан хэдэн quest үүсгэнэ</li>
            <li>Гишүүн бүр өөрийн lobby-ийн active quest жагсаалттай болно</li>
          </ol>
          <Callout tone="info">
            <strong>AI bonus class:</strong> AI quest үүсгэхдээ нэг class-ийг “bonus” болгож тэмдэглэнэ. Тэр class-тай
            хэрэглэгч уг quest-ийг биелүүлбэл +25% XP илүү авна.
          </Callout>
        </Section>

        <Section id="submission" emoji="📸" title="Submission & Veto Vote">
          <p>
            Quest биелүүлсэн гэдгээ <strong>зураг/видеогоор</strong> баталгаажуулна. Бусад гишүүд <em>vote</em> хийж
            батална.
          </p>
          <h4 className="sub">Submission хэрхэн илгээх</h4>
          <ol className="list-numbered">
            <li>Quest detail page руу ор</li>
            <li>Зураг / видео сонго (хүртэл <strong>10 ширхэг</strong>)</li>
            <li>Caption бичих (заавал биш)</li>
            <li>Илгээ → Cloudinary дээр upload болж <em>PENDING</em> төлөвт ороно</li>
          </ol>
          <h4 className="sub">EXIF photo gate</h4>
          <Callout tone="warn">
            Зураг тухайн өдөрт авагдсан байх ёстой. <strong>EXIF</strong> дата (зургийн camera metadata) шалгаж, өмнө
            нь авсан зураг бол блок хийнэ. Энэ нь quest-ийг “нөгөө өдрийн зургаар” залилахаас сэргийлэх зорилготой.
          </Callout>
          <h4 className="sub">Veto voting</h4>
          <p>
            Lobby-н бусад гишүүд таны submission-д <strong>APPROVE</strong> / <strong>REJECT</strong> санал өгнө.
            Босго ханасны дараа:
          </p>
          <ul className="list-bullets">
            <li><strong>APPROVED</strong> → XP/Coin шууд орно, Achievement тоологдоно, Feed-д цацагдана</li>
            <li><strong>REJECTED</strong> → Шагнал өгөхгүй. Залилан илрэх юм бол.</li>
            <li><strong>PENDING</strong> → санал хүрэлцэхгүй хүлээж байна</li>
          </ul>
          <p>
            Энэ нь <em>“хүний өөрийгөө нэр төртэй биелүүлнэ үү”</em> гэсэн<strong> social proof</strong> механикийн гол хэсэг.
          </p>
        </Section>

        <Section id="comments" emoji="💬" title="Submission Comments">
          <p>
            Submission бүр өөрийн comment thread-тэй. Гишүүд reaction, бахархал, маргаан бичих. Энэ нь
            <strong> public proof</strong>-д амь дусаах social лаб болдог.
          </p>
          <ul className="list-bullets">
            <li>Maргаан/тайлбар (vote-аас гадуурх контекст) хийх үед хэрэгтэй</li>
            <li>Нэг submission дээр олон гишүүн ярилцаж болно</li>
            <li>Зөвхөн lobby-н гишүүд харна</li>
          </ul>
        </Section>

        <Section id="create-quest" emoji="✍️" title="Өөрөө Quest үүсгэх">
          <p>
            <Link href="/quests/create" className="link">/quests/create</Link>-ээс <strong>QuestTemplate</strong>{" "}
            (саналын quest) илгээж болно. <strong>Admin батална</strong> → глобал Quest болж, тус хэрэглэгчид
            үүсгэгчийн бонус шагнал орно.
          </p>
          <ul className="list-bullets">
            <li>Нийтийн санаа болж сайжруулагдсан apps-ын “user-generated quest” systeem</li>
            <li><Link href="/quests/mine" className="link">/quests/mine</Link>-ээс өөрийнхөө илгээсэн жагсаалтыг харна</li>
            <li>Admin reject хийвэл шалтгаан илгээж болно</li>
          </ul>
        </Section>

        <Section id="checkin" emoji="🎁" title="Daily Check-In & Streak">
          <p>
            Өдөр бүр <strong>1 удаа</strong> <Link href="/dashboard" className="link">Dashboard</Link> дээрх{" "}
            <em>Claim</em> товчоор check-in хийнэ. Coin + XP олно, <strong>streak</strong> +1 болно.
          </p>
          <KVList>
            <KV label="Үндсэн шагнал">Coin + XP (өдөр бүр пропорциональ)</KV>
            <KV label="Streak bonus">Дараалсан өдрүүдийн urнамшуулал</KV>
            <KV label="Milestone">7 / 30 / 100 ... өдрийн ой тэмдэглэгч</KV>
            <KV label="Reset">Өдөр алгассан бол streak = 0 (Streak Recovery бол өөр асуудал)</KV>
          </KVList>
          <Callout tone="success">
            Streak урт байх тусам Quest reward-ын <strong>multiplier</strong> өсдөг. Дараалал бол хамгийн чухал KPI.
          </Callout>
        </Section>

        <Section id="streak-recover" emoji="🔥" title="Streak Recovery">
          <p>
            Өдөр алгассан бол <strong>Coin зарцуулж</strong> streak-ээ <em>сэргээж</em> болно (хязгаарлагдмал хугацаанд).
            Dashboard дээр “🔥 X хоногийн streak алдах гэж байна” гэсэн banner-аар санал гарна.
          </p>
          <ul className="list-bullets">
            <li>Алгассан өдрийн тоо, шаардагдах coin тоо хамт харагдана</li>
            <li>Coin хүрэхгүй бол товч идэвхгүй</li>
            <li>Сэргээсний дараа streak шууд буцаж сэргэдэг</li>
          </ul>
        </Section>

        <Section id="safe-mode" emoji="🏕️" title="Camping Pass (Safe Mode)">
          <p>
            Аян хийх, ажилгүй болох, амрах гэх мэт тохиолдолд <Link href="/safe-mode" className="link">Safe Mode</Link>{" "}
            идэвхжүүлээрэй. Streak <em>царцана</em>, өдөр бүр автомат <strong>+10 XP</strong> олно.
          </p>
          <KVList>
            <KV label="Үнэ"><strong>50 🪙</strong> / хоног</KV>
            <KV label="Period">1, 3, эсвэл 7 хоног</KV>
            <KV label="Үр дүн">Streak царцаасан · Идэвхгүй ч XP олж байна</KV>
            <KV label="Status">Бусдад “Offline / Camping” байдлаар харагдана</KV>
          </KVList>
        </Section>

        <Section id="trivia" emoji="🧠" title="Trivia">
          <p>
            <Link href="/trivia" className="link">Trivia</Link> бол community-аас үүсгэсэн multiple-choice асуултууд.
            Зөв хариулбал XP + Coin авна.
          </p>
          <ul className="list-bullets">
            <li>Асуулт бүрд 4 option, 1 зөв хариулт</li>
            <li>Хоосон болтол хариулна (хариулсан асуултыг дахин харахгүй)</li>
            <li><Link href="/trivia/create" className="link">/trivia/create</Link>-ээр өөрөө асуулт оруулна → admin батална</li>
            <li>Таны үүсгэсэн асуултыг бусад зөв хариулах бүрд та <em>passive coin</em> олно</li>
            <li><Link href="/trivia/mine" className="link">/trivia/mine</Link> — өөрийн үүсгэсэн жагсаалт</li>
          </ul>
          <Callout tone="info">
            <strong>MAGE</strong> класс хэрэглэгчид trivia-д +25% XP олдогийг бүү март!
          </Callout>
        </Section>

        <Section id="pushups" emoji="💪" title="AI Push-up Challenge">
          <p>
            Утасны камер ашиглан AI таны <strong>суниалт (push-up)</strong>-ыг тоолно. Суниалт тус бүрд coin шагнал.
          </p>
          <KVList>
            <KV label="Хаалга">Эхэндээ түгжээтэй. <strong>cooldown</strong> хугацаа дуусахад нээгдэнэ.</KV>
            <KV label="Шагнал">~2 🪙 / суниалт (динамик динамик)</KV>
            <KV label="Preset">5 / 10 / 20 / 30 суниалтын session</KV>
            <KV label="Анти-чит">Камер-ийн pose-detection + cooldown</KV>
          </KVList>
          <p>
            <Link href="/pushups" className="link">/pushups</Link> руу очно. Унлок болоогүй бол Dashboard дээр{" "}
            “🔒 X хоногийн дараа нээгдэнэ” гэж заана.
          </p>
        </Section>

        <Section id="shop" emoji="🛍️" title="Shop & Inventory">
          <p>
            <Link href="/shop" className="link">/shop</Link>-оос Coin-ээ зарцуулна. <strong>Inventory</strong> tab дээр
            өөрийн авсан зүйл байна.
          </p>
          <h4 className="sub">Бараа төрлүүд</h4>
          <Grid2>
            <ItemType emoji="🏷️" name="TITLE" color="text-neon-purple">
              Lobby-д харагдах <em>neon title</em> (ж: “Quest Master”). Lobby тус бүрт зүүнэ.
            </ItemType>
            <ItemType emoji="✨" name="BUFF" color="text-neon-green">
              Найзынхаа XP-г нэг хугацаагаар нэмэгдүүлнэ (multiplier {">"} 1).
            </ItemType>
            <ItemType emoji="💀" name="DEBUFF" color="text-neon-red">
              Дайсныхаа XP-г бууруулна (multiplier &lt; 1). Strategy-ийн хэсэг.
            </ItemType>
            <ItemType emoji="⚡" name="XP_BOOST" color="text-neon-blue">
              Өөрийн XP-г түр хугацаагаар нэмэгдүүлнэ.
            </ItemType>
            <ItemType emoji="🔄" name="QUEST_REROLL" color="text-neon-orange">
              Дургүй quest-ыг шинээр сольж авна. Quest detail дотроос ашиглана.
            </ItemType>
            <ItemType emoji="🖼️" name="AVATAR_FRAME" color="text-neon-gold">
              Avatar-аа эргэн тойронд хүрээ зүүнэ. Animation бүхий ч байна.
            </ItemType>
          </Grid2>
          <h4 className="sub">Rarity</h4>
          <div className="flex flex-wrap gap-2">
            <RarityBadge name="COMMON" />
            <RarityBadge name="RARE" />
            <RarityBadge name="EPIC" />
            <RarityBadge name="LEGENDARY" />
          </div>
          <Callout tone="info">
            Нэг л удаа авдаг зүйлс (TITLE, AVATAR_FRAME) дахин худалдан авагдах боломжгүй. Shop дээр “Авсан” гэж харна.
          </Callout>
        </Section>

        <Section id="effects" emoji="✨" title="Buff & Debuff (ActiveEffect)">
          <p>
            Shop-оос авсан Buff/Debuff-ийг хэрэглэхдээ target хэрэглэгчээ сонгоно. Effect нь хязгаарлагдмал хугацаатай
            ажиллана.
          </p>
          <Grid2>
            <FeatureCard emoji="✨" title="BUFF (Ивээх)">
              Найзаа дэмжих. Тухайн хэрэглэгчийн XP олох олох бүрт multiplier бүхий бонус нэмэгдэнэ.
            </FeatureCard>
            <FeatureCard emoji="💀" title="DEBUFF (Хараах)">
              Өрсөлдөгчдөө хортой. Олох XP-нь бууруулсан multiplier-аар тооцогдоно.
            </FeatureCard>
          </Grid2>
          <p>
            Notification page-аас “✨ Buff авлаа” эсвэл “💀 Debuff авлаа” гэсэн event-ыг харна.
          </p>
        </Section>

        <Section id="frames-titles" emoji="🖼️" title="Avatar Frame & Custom Title">
          <p>
            Хувийн өнгө аяс нэмэх <strong>cosmetic</strong> систем.
          </p>
          <ul className="list-bullets">
            <li><strong>Frame</strong> — global. Shop-оос авсны дараа Inventory-оос <em>Зүүх</em>. Profile, Feed, Leaderboard, Comment бүх газарт харагдана.</li>
            <li><strong>Animated frame</strong> — spin / hue / pulse / sparkle / flicker animation бүхий хувилбарууд</li>
            <li><strong>Title</strong> — lobby тус бүрт өөр өөр (lobby-н member row дээр neon өнгөтэй харагдана)</li>
            <li>Frame тайлахдаа дахин товшино</li>
          </ul>
        </Section>

        <Section id="achievements" emoji="🏆" title="Achievements">
          <p>
            <Link href="/achievements" className="link">/achievements</Link>. Тодорхой нөхцөл хангаснаар unlock хийгдэх
            badge. Гар аргаар <strong>Claim</strong> хийж XP + Coin шагнал авдаг.
          </p>
          <ul className="list-bullets">
            <li><strong>Unclaimed</strong> badge → BottomNav-н Profile icon дээр улаан count харагдана</li>
            <li>Rarity: COMMON / RARE / EPIC / LEGENDARY</li>
            <li>Claim хийхэд <em>Celebration animation</em> (confetti) гарна</li>
            <li>Feed дээр найзын achievement шууд цацагдана</li>
          </ul>
        </Section>

        <Section id="games" emoji="🎮" title="Mini-Games (Betting)">
          <p>
            <Link href="/games" className="link">/games</Link>. Найзыгаа Coin tavin challenge-аар duudna. Хожиж буцаагаад
            давхар coin авна.
          </p>
          <Grid3>
            <FeatureCard emoji="✊" title="RPS">
              Чулуу-Цаас-Хайч. Real-time turn-based.
            </FeatureCard>
            <FeatureCard emoji="❌" title="Tic-Tac-Toe">
              3×3 классик. Сонгох ээлжийг сольно.
            </FeatureCard>
            <FeatureCard emoji="🪙" title="Coin Flip">
              50/50 азын тоглоом. Хурдан, эрсдэлтэй.
            </FeatureCard>
          </Grid3>
          <KVList>
            <KV label="Bet хэмжээ">5 - 5000 🪙 (танай coin-оор хязгаарлагдана)</KV>
            <KV label="Status">PENDING (хүлээгдэж буй) → ACTIVE → COMPLETED / CANCELLED</KV>
            <KV label="Notification">Challenge ирвэл push notification очно</KV>
            <KV label="Найз">Зөвхөн <strong>ACCEPTED</strong> найзтайгаа тоглоно</KV>
          </KVList>
        </Section>

        <Section id="friends" emoji="🤝" title="Найз нэмэх (Friendship)">
          <p>
            <Link href="/users" className="link">/users</Link>-аас хүн хайж <strong>Add Friend</strong> дарна.
            Хүлээн авсан тал баталгаажуулсны дараа найз болно.
          </p>
          <ul className="list-bullets">
            <li><strong>PENDING</strong> → хүлээж байгаа</li>
            <li><strong>ACCEPTED</strong> → найз</li>
            <li><strong>BLOCKED</strong> → блоклосон (зарим mutation хориглоно)</li>
          </ul>
          <p>
            Найз болсон тохиолдолд: Feed дээр идэвхжил харагдана, mini-game challenge илгээж болно, lobby invite илгээх
            хялбар.
          </p>
        </Section>

        <Section id="feed" emoji="📡" title="Найзуудын Feed">
          <p>
            <Link href="/feed" className="link">/feed</Link> бол найз нөхдийн live идэвхжлийн стрэлэн. 60 секунд тутамд
            автомат refresh.
          </p>
          <ul className="list-bullets">
            <li>📸 Найзын <em>approved submission</em> — quest нэр, media preview, олсон XP</li>
            <li>🏆 Найзын <em>achievement unlock</em> — emoji, rarity өнгө</li>
            <li>Submission дээр шууд дарж quest руу шилжинэ</li>
          </ul>
        </Section>

        <Section id="map" emoji="🗺️" title="Snapchat-style Live Map">
          <p>
            <Link href="/map" className="link">/map</Link> бол найзуудтайгаа байршил <strong>real-time</strong>{" "}
            хуваалцах Snapchat-style газрын зураг. <strong>Pusher</strong> ашиглан секунд тутамд шинэчилнэ.
          </p>
          <h4 className="sub">Гол boomиш</h4>
          <ul className="list-bullets">
            <li>📍 Avatar нь шууд markeр болж газрын зураг дээр харагдана (зүүсэн frame-тэйгээ)</li>
            <li>🟢 Сүүлийн 90 секунд дотор хөдөлсөн бол <strong>LIVE</strong> pulse ring тэрхэн дороо</li>
            <li>⏱️ Үгүй бол “5м”, “1ц”, “2ө” гэх мэт last-seen status</li>
            <li>🎯 Доорх найз нөхдийн <em>carousel</em>-аас товшоод түүн рүү <strong>fly-to</strong> camera</li>
            <li>📡 Бусад гишүүний байршил өөрчлөгдөхөд таны map дээр <strong>зөөлөн animation</strong>-оор шилжинэ</li>
            <li>🎯 Recenter товч — гэнэт өөрийн локацид буцаж шилжих</li>
          </ul>
          <h4 className="sub">Хэрхэн ажилладаг</h4>
          <ol className="list-numbered">
            <li>Дээд буланд <strong>“Байршил хуваалцах”</strong> товч дар → browser permission</li>
            <li><code className="kbd">watchPosition</code>-оор автомат шинэчилнэ (8 секундын throttle)</li>
            <li>Server тал танай <strong>бүх lobby</strong>-ийн Pusher channel руу broadcast хийнэ</li>
            <li>Тус lobby-ийн бусад гишүүд тэр даруй markeр шинэчлэгдэхийг харна</li>
            <li>Хуваалцахаа болих товч дарвал бусдад <em>offline</em> сигнал явна</li>
          </ol>
          <Callout tone="info">
            <strong>Fog of War</strong>: Өөрөө Quest биелүүлж APPROVE болгуулсан байх ёстой → бусдын байршил{" "}
            <strong>1 цаг</strong> нээгдэнэ. Энэ нь идэвхтэй тоглогчийг шагнах механизм.
          </Callout>
          <Callout tone="warn">
            Browser-аас Location permission авна. Permission олгоогүй бол энэ feature ажиллахгүй. Push notif шиг
            PWA горимд илүү тогтвортой.
          </Callout>
        </Section>

        <Section id="leaderboard" emoji="📊" title="Leaderboard">
          <p>
            <Link href="/leaderboard" className="link">/leaderboard</Link> — XP-ээр эрэмбэлсэн глобал rank. Top 3
            <strong> 🥇 🥈 🥉</strong> emoji-той онцлогдоно.
          </p>
          <ul className="list-bullets">
            <li>XP, Level, Streak зэргийг харна</li>
            <li>Avatar Frame шууд харагдана</li>
            <li>Хүн дээр дарж <Link href="/users" className="link">profile</Link> руу шилжих</li>
          </ul>
        </Section>

        <Section id="history" emoji="📚" title="Submission History">
          <p>
            <Link href="/history" className="link">/history</Link> — өмнөх бүх submission, тэдгээрийн approved /
            pending / rejected статус, олсон XP & Coin.
          </p>
          <KVList>
            <KV label="Filter">ALL / APPROVED / PENDING / REJECTED</KV>
            <KV label="Stats">Нийт тоо, approved тоо, нийт XP</KV>
            <KV label="Media preview">Зураг, видео шууд харагдана</KV>
          </KVList>
        </Section>

        <Section id="albums" emoji="🖼️" title="Album & Auto-generated Video">
          <p>
            Approved submission зургуудаа <strong>Album</strong>-д цуглуулж, эцэст нь <em>video reel</em> үүсгэх боломжтой.
            Дурсамж бүтээх feature.
          </p>
          <ul className="list-bullets">
            <li>Photo-уудаа дарааллаар тохируулах</li>
            <li>Cover зураг сонгох</li>
            <li>Video generation pipeline (NONE → PROCESSING → READY)</li>
            <li>Profile-оос Album tab дээр харагдана</li>
          </ul>
        </Section>

        <Section id="notifications" emoji="🔔" title="Notifications & Push">
          <p>
            <Link href="/notifications" className="link">/notifications</Link> дээр бүх event цуглардаг. Topbar дээр
            унлоск count нь улаан болж харагдана.
          </p>
          <h4 className="sub">Notification төрлүүд</h4>
          <ul className="list-bullets">
            <li>🗳️ <strong>vote_needed</strong> — танаас submission-д vote хүлээж байна</li>
            <li>✅ <strong>submission_approved</strong> — таны submission батлагдлаа</li>
            <li>❌ <strong>submission_rejected</strong> — татгалзав</li>
            <li>✨ <strong>buff_received</strong> · 💀 <strong>debuff_received</strong></li>
            <li>📩 <strong>lobby_invite</strong> · 🤝 <strong>friend_accepted</strong> · 👋 <strong>friend_request</strong></li>
            <li>🏆 <strong>achievement_unlocked</strong></li>
            <li>⚡ <strong>quest_assigned</strong></li>
            <li>🎮 <strong>game_challenge</strong> / accepted / declined</li>
            <li>📣 <strong>chat_mention</strong> · 💬 <strong>chat_reply</strong></li>
            <li>🧠 <strong>TRIVIA_APPROVED</strong> / REJECTED / PENDING</li>
            <li>🏕️ <strong>SAFE_MODE_DAILY_XP</strong></li>
          </ul>
          <h4 className="sub">Push notifications</h4>
          <p>
            Browser-н <strong>Web Push</strong> ашиглана. /notifications дээрх <em>PushToggle</em>-аар идэвхжүүлээрэй.
            iOS дээр PWA-ийг home screen-д суулгасан тохиолдолд л push ажиллана.
          </p>
        </Section>

        <Section id="chat" emoji="💭" title="Lobby Chat (Real-time)">
          <p>
            Lobby detail дотор <strong>Chat tab</strong> байна. Pusher real-time-аар шинэчилдэг.
          </p>
          <ul className="list-bullets">
            <li><strong>Mention</strong> — <code className="kbd">@username</code> бичих → notification очно</li>
            <li><strong>Reply</strong> — өмнөх мессеж дээр reply хийх → original poster-д notification</li>
            <li>System message — quest үүсгэгдэх, гишүүн орох/гарах гэх мэт автомат event</li>
            <li>Quest, Submission, Friend гэх мэт <em>inline preview</em> link</li>
          </ul>
        </Section>

        <Section id="birthday" emoji="🎂" title="Birthday Popup">
          <p>
            Profile-д төрсөн өдрөө оруулсан бол тэр өдөр апп нээх үед автомат popup гарч ирнэ. Тусгай Coin/XP бэлэг
            нэг удаа claim хийгдэнэ.
          </p>
        </Section>

        <Section id="pwa" emoji="📱" title="PWA & Утсандаа суулгах">
          <p>
            SideQuest бол <strong>Progressive Web App</strong>. Утсандаа суулгах боломжтой.
          </p>
          <Grid2>
            <FeatureCard emoji="🍎" title="iOS">
              Safari-аар нээгээд <strong>Share → Add to Home Screen</strong>. Дараа нь native app-аас ялгаагүй
              <em> standalone</em> горимд ажиллана.
            </FeatureCard>
            <FeatureCard emoji="🤖" title="Android (Chrome)">
              Сайт нээх үед <strong>Install Prompt</strong> автоматаар гарна. Home screen дээр нэмэгдэнэ. TWA-аар Google
              Play-д ч очих боломжтой.
            </FeatureCard>
          </Grid2>
          <ul className="list-bullets">
            <li>Offline хуудас (<Link href="/offline" className="link">/offline</Link>) — интернетгүй үед alternative</li>
            <li>Service Worker автомат update — шинэ version ирэхэд reload</li>
            <li>Home screen icon, splash screen бүгд бэлэн</li>
          </ul>
        </Section>

        <Section id="admin" emoji="🛠️" title="Admin Panel">
          <p>
            Зөвхөн <code className="kbd">isAdmin = true</code> хэрэглэгчдэд BottomNav-д <strong>Admin</strong> tab
            нэмэгддэг. Бусадад харагдахгүй.
          </p>
          <ul className="list-bullets">
            <li><Link href="/admin/quests" className="link">Quests</Link> — global quest жагсаалт</li>
            <li><Link href="/admin/quest-templates" className="link">Quest Templates</Link> — хэрэглэгчээс ирсэн санал шалгах</li>
            <li><Link href="/admin/trivia" className="link">Trivia</Link> — асуултын модерац</li>
            <li><Link href="/admin/submissions" className="link">Submissions</Link> — маргаантай submission шийдвэрлэх</li>
            <li><Link href="/admin/users" className="link">Users</Link> — хэрэглэгчийн жагсаалт, ban</li>
            <li><Link href="/admin/lobbies" className="link">Lobbies</Link></li>
            <li><Link href="/admin/shop" className="link">Shop Items</Link> — шинэ бараа нэмэх, үнэ тохируулах</li>
            <li><Link href="/admin/achievements" className="link">Achievements</Link> — шинэ badge тодорхойлох</li>
            <li><Link href="/admin/effects" className="link">Active Effects</Link></li>
            <li><Link href="/admin/crons" className="link">Cron jobs</Link></li>
            <li><Link href="/admin/broadcast" className="link">Broadcast</Link> — бүх хэрэглэгчид notification illgeeh</li>
          </ul>
        </Section>

        <Section id="economy" emoji="💱" title="Economy Cheat Sheet">
          <p>Coin олох, зарцуулах гол замуудын ширээний хүснэгт. Бодит тоонууд админ тохиргооноос хамаарч өөрчлөгдөж болно.</p>
          <h4 className="sub">Coin олох</h4>
          <KVList>
            <KV label="Daily Check-In">~10–50 🪙 (streak-аар өснө)</KV>
            <KV label="Quest approved">5–200 🪙 (difficulty)</KV>
            <KV label="Trivia зөв хариулт">5–20 🪙</KV>
            <KV label="Push-up суниалт">2 🪙 / суниалт</KV>
            <KV label="Achievement claim">10–500 🪙 (rarity)</KV>
            <KV label="Mini-game ялалт">Bet × 2</KV>
          </KVList>
          <h4 className="sub">Coin зарцуулах</h4>
          <KVList>
            <KV label="Camping Pass">50 🪙 / хоног</KV>
            <KV label="Streak Recovery">Алгассан өдөр × нэгж үнэ</KV>
            <KV label="Quest Reroll">~30 🪙</KV>
            <KV label="XP Boost">~50–200 🪙</KV>
            <KV label="Buff (найзад)">~80–250 🪙</KV>
            <KV label="Debuff (өрсөлдөгчид)">~100–300 🪙</KV>
            <KV label="Custom Title">100–500 🪙 (rarity)</KV>
            <KV label="Avatar Frame">200–2000 🪙 (rarity)</KV>
          </KVList>
          <Callout tone="info">
            <strong>Зөвлөгөө:</strong> Шинээр эхэлж буй бол coin-ийг эхлээд <em>Frame</em> эсвэл <em>Reroll</em>-д
            хадгал. Buff/Debuff-аар үрэхээс татгалзаарай — тэр нь нийт economy-нд бага үр дүн өгдөг.
          </Callout>
        </Section>

        <Section id="tips" emoji="🚀" title="Pro Tips">
          <Grid2>
            <FeatureCard emoji="🌅" title="Өглөөгөөр lobby ор">
              AI quest-ийн ихэнх нь ажлын өдөр эхэлдэг. Өглөө очвол EMERGENCY quest-аас хүлээн авах магадлал өндөр.
            </FeatureCard>
            <FeatureCard emoji="🤝" title="Class-аа тохируулагтун">
              Найзууд чинь TANK сонгосон бол MAGE болж тэнцвэр хадгал — Quest reward-ыг хамгийн их боллгох арга.
            </FeatureCard>
            <FeatureCard emoji="📸" title="Зургийг квест биелүүлэх явцад нь авах">
              EXIF gate тухайн өдрийн зургийг л хүлээж авна. <em>Дараа нь</em> ажиглах болохгүй — тэр дороо буулга.
            </FeatureCard>
            <FeatureCard emoji="🔥" title="Streak-ээ тогтворжуул">
              30 хоногийн дараа streak bonus максимум +30% болж тогтворждог. Эхэндээ хайр гүйцэхгүй ч 30+ ирвэл удаан үргэлжилнэ.
            </FeatureCard>
            <FeatureCard emoji="🏕️" title="Аян хийхээсээ өмнө Safe Mode авах">
              30+ хоногийн streak-аа алдахаас илүү 50 🪙 өгөх нь хямд. Ялангуяа long-trip үед.
            </FeatureCard>
            <FeatureCard emoji="🧠" title="Trivia үүсгээд passive coin олох">
              Бусад зөв хариулсан тоо тутамд танд coin орно — community-аас "rent" авах хамгийн хямд арга.
            </FeatureCard>
            <FeatureCard emoji="🎮" title="Bet нь mood-ийн дагуу">
              Coin-ээ алдах нь streak-ийг нөлөөлдөггүй ч psychologically мунгинадаг. Coin-ийн 10%-аас хэтрүүлж бет хийхгүй.
            </FeatureCard>
            <FeatureCard emoji="📡" title="Feed-ийг идэвхтэй ажигла">
              Найзынхаа quest-д vote хийх нь өөрийн "социал ажил"-аас. Vote-оор тэд танаас илүү идэвхтэй болж эргэн төлнө.
            </FeatureCard>
          </Grid2>
        </Section>

        <Section id="glossary" emoji="📖" title="Glossary (Үг хэллэг)">
          <KVList>
            <KV label="XP">Experience point — level дээшлэх metric, зарцуулдаггүй</KV>
            <KV label="Coin (🪙)">Хэрэглэдэг valyut — shop, bet, streak recovery</KV>
            <KV label="Streak">Дараалсан өдрийн check-in тоо</KV>
            <KV label="Lobby">Найзуудын party — quest, chat, location-ийн хүрээ</KV>
            <KV label="Class">TANK / MAGE / CLOWN — +25% XP-ийн зориулалт</KV>
            <KV label="Quest">Биелүүлэх ёстой даалгавар (DAILY / EMERGENCY)</KV>
            <KV label="Submission">Quest биелүүлсэн photo/video proof</KV>
            <KV label="Veto">Бусдаас ирэх APPROVE / REJECT санал</KV>
            <KV label="EXIF">Зургийн metadata — авагдсан огноо/камер</KV>
            <KV label="Fog of War">Quest approve хийгээгүй үед бусдын байршил хаагдах</KV>
            <KV label="Buff / Debuff">XP multiplier өөрчилдөг түр effect</KV>
            <KV label="Frame">Avatar-ийн эргэн тойронд хүрээ — cosmetic</KV>
            <KV label="Title">Lobby-д харагдах neon нэр</KV>
            <KV label="Reroll">Quest-ийг шинээр сольж авах эрх</KV>
            <KV label="Safe Mode">Streak царцаах хязгаарлагдмал статус</KV>
          </KVList>
        </Section>

        <Section id="troubleshoot" emoji="🩹" title="Troubleshooting">
          <FAQ q="“Зураг өнөөдөр аваагүй байна” гэж блок хийж байна.">
            EXIF metadata тухайн өдөрт таарахгүй байна. Шинэ зураг авч ороорой. Зарим утсанд зураг авах үед EXIF
            хадгалах сэтгэгдсэн байх ёстой — настройкаас Location/Time-ыг идэвхжүүлээрэй.
          </FAQ>
          <FAQ q="Push notification ирэхгүй байна.">
            (1) <Link href="/notifications" className="link">/notifications</Link>-аас Push Toggle асаасан эсэхээ шалга.{" "}
            (2) iOS бол PWA-аа Home Screen-д суулгасан байх. (3) Browser permission зөвшөөрөгдсөн эсэхээ шалга.
          </FAQ>
          <FAQ q="Map дээр бусдын байршил харагдахгүй байна.">
            Та өөрөө Quest-аа approve болгуулаагүй байж магадгүй. Approve болсон Quest нэг бүр <strong>1 цаг</strong>{" "}
            Fog-of-War арилгана.
          </FAQ>
          <FAQ q="Lobby chat шинэчлэгдэхгүй байна.">
            Pusher холболт идэвхтэй эсэхээс хамаарна. Browser tab background-д удаан байсан бол refresh хийгээрэй.
            Эсвэл интернет холболтоо шалга.
          </FAQ>
          <FAQ q="Achievement шууд claim хийгдэхгүй байна.">
            <Link href="/achievements" className="link">/achievements</Link> рүү ороод claim товчийг гар аргаар дар.
            Auto-claim хийгддэггүй (зориудаар — celebration animation-ийг та харах ёстой).
          </FAQ>
          <FAQ q="Streak алдсан ч banner харагдахгүй.">
            Streak Recovery нь зөвхөн хязгаарлагдмал хугацааны дотор боломжтой (ихэвчлэн 24 цаг). Энэ хугацаа дуусвал
            автоматаар алга болно.
          </FAQ>
          <FAQ q="Quest reroll-ын бараа ашиглахад reload болоход алга.">
            Quest detail page-аас reroll хийнэ. Inventory tab-аас “Quest-д ашиглана” гэж бичигдсэн нь үүнийг хэлж байна.
          </FAQ>
          <FAQ q="Дотогш орох үед “Network error” гарч байна.">
            Service Worker cache-аас ирж байна. Hard refresh (Cmd+Shift+R) хийгээрэй, эсвэл browser-ийн cache цэвэрлэ.
          </FAQ>
        </Section>

        <Section id="privacy" emoji="🔒" title="Privacy & Data">
          <p>
            SideQuest аль болох <strong>хамгийн бага</strong> мэдээллийг л хадгална. Дараах өгөгдлүүд server-т хадгалагдана:
          </p>
          <ul className="list-bullets">
            <li><strong>Бүртгэлийн мэдээ</strong> — email, нууц үг (bcrypt hash), username, displayName</li>
            <li><strong>Profile</strong> — bio, avatar URL (Cloudinary), төрсөн өдөр (сонгомол), interests</li>
            <li><strong>Activity</strong> — quest, submission, vote, achievement, friend graph</li>
            <li><strong>Location</strong> — зөвхөн та идэвхтэй <em>Share</em> хийсэн үед, lobby гишүүдэд харагдана</li>
            <li><strong>Notifications</strong> — push token (хэрэв subscribe хийсэн)</li>
          </ul>
          <h4 className="sub">Юу хадгалдаггүй вэ?</h4>
          <ul className="list-bullets">
            <li>Камерын дүрс зураг бичих/хадгалахгүй — submission-д <em>таны өөрийн</em> upload л үлдэнэ</li>
            <li>Push-up counter pose detection нь зөвхөн client-side (зураг server-т явдаггүй)</li>
            <li>Контактын жагсаалт авдаггүй</li>
            <li>Захиаг 3-р этгээдэд зардаггүй</li>
          </ul>
          <h4 className="sub">Цуцлах, устгах</h4>
          <p>
            Account устгах хүсэлтээ <a href="mailto:support@sidequest.app" className="link">support@sidequest.app</a>{" "}
            руу илгээгээрэй. 7 хоногийн дотор бүх өгөгдөл backup-ийг оруулаад устгана.
          </p>
          <Callout tone="warn">
            Lobby-д хуваалцсан мессеж, submission media нь lobby устгасан тохиолдолд cascade-аар бүгд устдаг.
            Холбогдох найзууд тэр мэдээллийг буцааж нөхөж чадахгүй.
          </Callout>
        </Section>

        <Section id="changelog" emoji="📝" title="Changelog (шинэ боломжууд)">
          <p className="text-xs text-muted-foreground">
            Хамгийн сүүлийн өөрчлөлтүүд хамгийн дээр. Огноо нь монгол улсын цагаар.
          </p>
          <Change date="2026-06-06" tag="UI">
            Snapchat-style Live Map · Pusher real-time байршил · Friend carousel + fly-to camera.
          </Change>
          <Change date="2026-06-06" tag="Help">
            <code className="kbd">/help</code> public manual — search, scroll progress, groups.
          </Change>
          <Change date="2026-06-06" tag="UI">
            BottomNav-д <strong>Feed</strong> tab. Item-уудыг compact болгож, хэвтээ scroll fallback.
          </Change>
          <Change date="2026-06-06" tag="Perf">
            Feed: cursor pagination + infinite-scroll, lazy media, video pause off-screen.
          </Change>
          <Change date="2026-Q2" tag="Game">
            User-authored quest · Submission comments · EXIF photo gate · Animated frames · Economy rebalance.
          </Change>
          <Change date="2026-Q2" tag="Game">
            History, streak recovery, reroll, feed, chat reply + mention, notif polish.
          </Change>
          <Change date="2026-Q2" tag="Fix">
            Coin/XP economy дахь race-condition exploit-уудыг бөглөв.
          </Change>
          <Change date="2026-Q1" tag="Game">
            Duplicate cosmetic худалдан авалтыг блок · avatars & frames-ийг олон газарт харуулах.
          </Change>
        </Section>

        <Section id="faq" emoji="❓" title="Түгээмэл асуулт (FAQ)">
          <FAQ q="Coin XP-ээс ялгаатай юу?">
            XP бол level/ranking-ийн хэмжүүр, зарцуулдаггүй. Coin бол хэрэглэдэг valyut — shop, bet, streak recovery,
            safe mode-д ашиглана.
          </FAQ>
          <FAQ q="Зөвхөн ганцаараа тоглож болох уу?">
            Болно, гэхдээ Quest-ийн veto vote, Buff/Debuff, Mini-game, Chat, Map зэрэг нь lobby-ийн хүний тоо олонтой
            байх тусам илүү идэвхтэй ажилладаг. Дор хаяж 1 найзтайгаа эхлээрэй.
          </FAQ>
          <FAQ q="Submission rejected болох гэж юу вэ?">
            Lobby гишүүд REJECT vote хийсэн, эсвэл EXIF (зургийн авагдсан өдөр) шалгуурт таараагүй гэсэн үг.
            Шагнал өгөгдөхгүй, харин дахин quest биелүүлж submission илгээж болно.
          </FAQ>
          <FAQ q="Аян хийх гэж байна. Streak-аа хэрхэн хадгалах вэ?">
            <Link href="/safe-mode" className="link">Camping Pass</Link> идэвхжүүлээрэй. Хоног тутамд 50🪙 төлж streak
            царцаана, өдөр бүр +10 XP олно.
          </FAQ>
          <FAQ q="Quest taagүй байвал юу хийх вэ?">
            <strong>Quest Reroll</strong> бараа Shop-оос авч, тус Quest detail page дотор reroll товч дарж шинэчил.
          </FAQ>
          <FAQ q="Хэрэглэгчдийн доромжлох эрсдэл хэр вэ?">
            Debuff, REJECT vote, mention зэрэг нь social pressure үүсгэдэг. Maргаан гарвал admin panel-аар submission
            эсвэл account дээр арга хэмжээ авна. Friendship BLOCK хийх боломжтой.
          </FAQ>
          <FAQ q="Push notification ирэхгүй байна.">
            (1) Profile/Notifications дотор <strong>Push Toggle</strong>-оо асаасан эсэхээ шалга. (2) iOS бол PWA
            суулгасан байх ёстой. (3) Browser permission зөвшөөрөгдсөн эсэхээ шалга.
          </FAQ>
          <FAQ q="Push-up Counter яагаад түгжээтэй вэ?">
            Анх хэрэглэгчид нэгэн зэрэг тоологдох эрсдэлээс сэргийлэх, cooldown механизм. Тодорхой хугацааны дараа
            автоматаар нээгдэнэ — Dashboard-д хэдэн хоног үлдсэнийг харна.
          </FAQ>
        </Section>

        {/* ─────── FOOTER ─────── */}
        <footer className="mt-20 pt-10 border-t border-border/50">
          <div className="game-card p-6 sm:p-8 text-center space-y-4">
            <div className="text-3xl">🎯</div>
            <h3 className="font-display text-lg font-bold">
              Бэлэн боллоо. Quest-ээ эхлүүлэх цаг боллоо.
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Найзаа урьж lobby-аа байгуул, AI-аар daily quest гаргаж, photo proof илгээ. Streak-ээ алдалгүй
              ялагч бол.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard" className="btn-game text-sm">→ Dashboard</Link>
              <Link href="/lobbies" className="btn-game-outline text-sm">+ Lobby үүсгэх</Link>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest pt-4">
              SideQuest Manual · Internal Reference · Bookmark <code className="kbd">/help</code>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* PRIMITIVES                                  */
/* ═══════════════════════════════════════════ */

function Section({
  id,
  emoji,
  title,
  children,
}: {
  id: string;
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 mb-14">
      <div className="flex items-center gap-3 mb-5">
        <span className="emoji-ring text-xl">{emoji}</span>
        <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <a
          href={`#${id}`}
          aria-label="Линк хуулах"
          className="ml-auto text-[11px] text-muted-foreground hover:text-neon-purple transition-colors font-mono"
        >
          #{id}
        </a>
      </div>
      <div className="prose-block space-y-4 text-sm sm:text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function Grid3({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>;
}

function FeatureCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="game-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="font-display text-sm font-semibold">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function ClassCard({
  name,
  emoji,
  color,
  bg,
  bonus,
  desc,
}: {
  name: string;
  emoji: string;
  color: string;
  bg: string;
  bonus: string;
  desc: string;
}) {
  return (
    <div className={`game-card p-4 ${bg} border-current/20`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{emoji}</span>
        <span className={`font-display text-sm font-bold ${color}`}>{name}</span>
      </div>
      <div className={`pill ${bg} ${color} mb-2 font-mono`}>+25% · {bonus}</div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function DiffPill({ name, desc }: { name: string; desc: string }) {
  const colorMap: Record<string, string> = {
    EASY: "text-neon-green bg-neon-green/10",
    MEDIUM: "text-neon-blue bg-neon-blue/10",
    HARD: "text-neon-orange bg-neon-orange/10",
    LEGENDARY: "text-neon-gold bg-neon-gold/10",
  };
  return (
    <div className="game-card p-3 flex items-center gap-3">
      <span className={`pill ${colorMap[name]} font-mono`}>{name}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </div>
  );
}

function ItemType({
  emoji,
  name,
  color,
  children,
}: {
  emoji: string;
  name: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="game-card p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{emoji}</span>
        <span className={`font-display text-sm font-bold ${color}`}>{name}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}

function RarityBadge({ name }: { name: string }) {
  const map: Record<string, string> = {
    COMMON: "text-muted-foreground bg-secondary border-border",
    RARE: "text-neon-blue bg-neon-blue/10 border-neon-blue/40",
    EPIC: "text-neon-purple bg-neon-purple/10 border-neon-purple/40",
    LEGENDARY: "text-neon-gold bg-neon-gold/10 border-neon-gold/40",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${map[name]}`}>
      {name}
    </span>
  );
}

function Stat({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="game-card p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-display text-sm font-bold">{label}</span>
        <span className="text-2xl">{value}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function KVList({ children }: { children: React.ReactNode }) {
  return <dl className="game-card p-4 space-y-2.5">{children}</dl>;
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs sm:text-sm">
      <dt className="text-muted-foreground flex-shrink-0">{label}</dt>
      <dd className="text-right text-foreground font-medium">{children}</dd>
    </div>
  );
}

function Callout({
  tone,
  children,
}: {
  tone: "info" | "warn" | "success";
  children: React.ReactNode;
}) {
  const map = {
    info: { emoji: "💡", color: "border-neon-blue/40 bg-neon-blue/5" },
    warn: { emoji: "⚠️", color: "border-neon-orange/40 bg-neon-orange/5" },
    success: { emoji: "✅", color: "border-neon-green/40 bg-neon-green/5" },
  } as const;
  const c = map[tone];
  return (
    <div className={`rounded-2xl border p-4 flex gap-3 text-xs sm:text-sm leading-relaxed ${c.color}`}>
      <span className="text-lg flex-shrink-0">{c.emoji}</span>
      <div>{children}</div>
    </div>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="game-card p-4 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
        <span className="font-display text-sm font-semibold">{q}</span>
        <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </details>
  );
}

function Change({
  date,
  tag,
  children,
}: {
  date: string;
  tag: string;
  children: React.ReactNode;
}) {
  const tagColor: Record<string, string> = {
    UI: "bg-neon-purple/15 text-neon-purple",
    Game: "bg-neon-blue/15 text-neon-blue",
    Perf: "bg-neon-green/15 text-neon-green",
    Fix: "bg-neon-orange/15 text-neon-orange",
    Help: "bg-neon-gold/15 text-neon-gold",
  };
  return (
    <div className="game-card p-3 flex items-start gap-3">
      <div className="flex-shrink-0 w-20 sm:w-24 text-[10px] font-mono text-muted-foreground">
        {date}
      </div>
      <div className="flex-shrink-0">
        <span className={`pill ${tagColor[tag] ?? "bg-secondary text-muted-foreground"} font-mono`}>
          {tag}
        </span>
      </div>
      <div className="flex-1 text-xs sm:text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function Loop() {
  const steps = [
    { e: "👥", t: "Lobby үүсгэх" },
    { e: "🎯", t: "Quest гарах" },
    { e: "📸", t: "Photo proof" },
    { e: "🗳️", t: "Veto vote" },
    { e: "⚡", t: "XP + 🪙" },
    { e: "🛍️", t: "Shop / Buff" },
  ];
  return (
    <div className="game-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        Core Loop
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.t} className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs">
              <span>{s.e}</span>
              <span className="font-medium">{s.t}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-muted-foreground">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
