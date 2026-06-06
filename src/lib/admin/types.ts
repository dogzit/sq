import type {
  CharacterClass,
  QuestDifficulty,
  QuestType,
  QuestStatus,
  ShopItemType,
  ItemRarity,
  VetoStatus,
  MediaType,
  EffectType,
} from "@/generated/prisma/client";

export type AdminStats = {
  userCount: number;
  lobbyCount: number;
  questCount: number;
  submissionCount: number;
  shopItemCount: number;
  pendingTriviaCount: number;
  pendingSubmissionCount: number;
  pendingQuestTemplateCount: number;
  activeQuestCount: number;
  last24hUserCount: number;
  last24hSubmissionCount: number;
};

export type AdminInboxUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type AdminInboxSubmission = {
  id: string;
  createdAt: string;
  mediaType: MediaType;
  user: AdminInboxUser;
  quest: { id: string; title: string } | null;
};

export type AdminInboxQuestTemplate = {
  id: string;
  title: string;
  createdAt: string;
  creator: AdminInboxUser;
};

export type AdminInboxTrivia = {
  id: string;
  question: string;
  createdAt: string;
  creator: AdminInboxUser;
};

export type AdminInbox = {
  pendingSubmissions: AdminInboxSubmission[];
  pendingQuestTemplates: AdminInboxQuestTemplate[];
  pendingTrivia: AdminInboxTrivia[];
};

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  xp: number;
  coins: number;
  level: number;
  streak: number;
  createdAt: string;
  emailVerified: string | null;
};

export type AdminQuest = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  difficulty: QuestDifficulty;
  questType: QuestType;
  isAiGenerated: boolean;
  bonusClass: CharacterClass | null;
  status: QuestStatus;
  startsAt: string;
  expiresAt: string;
  lobbyId: string | null;
  createdAt: string;
  updatedAt: string;
  lobby: { name: string } | null;
  _count: { submissions: number };
};

export type AdminShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  itemType: ShopItemType;
  value: string;
  iconEmoji: string;
  rarity: ItemRarity;
  createdAt: string;
  _count: { purchases: number };
};

export type AdminLobby = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  owner: { displayName: string; username: string };
  _count: { members: number; quests: number };
};

export type AdminData = {
  stats: AdminStats;
  inbox: AdminInbox;
  recentUsers: AdminUser[];
  activeQuests: AdminQuest[];
  shopItems: AdminShopItem[];
  lobbies: AdminLobby[];
};

export type DeleteTargetType = "user" | "quest" | "shopItem" | "lobby";

export type DeleteTarget = {
  type: DeleteTargetType;
  id: string;
  name: string;
};

export type UserUpdatePayload = {
  xp: number;
  coins: number;
  level: number;
  streak: number;
};

export type ShopItemPayload = {
  id?: string;
  name: string;
  description: string;
  price: number;
  itemType: ShopItemType;
  value: string;
  iconEmoji: string;
};

export type QuestCreatePayload = {
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  difficulty: QuestDifficulty;
  questType: QuestType;
  lobbyId: string;
  bonusClass: CharacterClass | "NONE";
  expiresInHours: number;
};

export type AdminSubmission = {
  id: string;
  mediaUrl: string;
  mediaType: MediaType;
  caption: string | null;
  vetoStatus: VetoStatus;
  vetoDeadline: string | null;
  approveCount: number;
  rejectCount: number;
  xpAwarded: number;
  coinsAwarded: number;
  createdAt: string;
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
  quest: { id: string; title: string };
};

export type AdminAchievement = {
  id: string;
  key: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
  coinReward: number;
  rarity: ItemRarity;
  createdAt: string;
  _count: { unlocks: number };
};

export type AchievementPayload = {
  id?: string;
  key: string;
  name: string;
  description: string;
  iconEmoji: string;
  xpReward: number;
  coinReward: number;
  rarity: ItemRarity;
};

export type AdminEffect = {
  id: string;
  effectType: EffectType;
  multiplier: number;
  expiresAt: string;
  createdAt: string;
  caster: { id: string; username: string; displayName: string };
  target: { id: string; username: string; displayName: string };
};

export type BroadcastPayload = {
  title: string;
  body: string;
  lobbyId: string | null;
};
