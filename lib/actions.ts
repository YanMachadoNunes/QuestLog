"use server";

import { prisma } from "./prisma";
import { getLevelInfo, isMilestoneLevel, getCharacterLevel, maxHpForCharLevel } from "./xp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Returns midnight of the given date in BRT (UTC-3)
function brtDayStart(date: Date): Date {
  const BRT_MS = 3 * 60 * 60 * 1000;
  const brt = new Date(date.getTime() - BRT_MS);
  return new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate()) + BRT_MS);
}

const HP_LOSS      = 10;
const HP_LOSS_BOSS = 30;
const HP_REGEN     = 5;

const HP_LOSS_BY_DIFF: Record<string, number> = { EASY: 5, NORMAL: 10, HARD: 20 };

const DIFFICULTY_MULT: Record<string, number> = { EASY: 0.5, NORMAL: 1, HARD: 2 };

function effectiveXP(baseXP: number, type: string, difficulty: string): number {
  const mult = type === "BOSS" ? 3 : (DIFFICULTY_MULT[difficulty] ?? 1);
  return Math.round(baseXP * mult);
}

async function syncMaxHp() {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char) return;
  const attrs = await prisma.attribute.findMany();
  const levels = ["FRC", "INT", "CAR", "DES", "SAB"].map(
    (t) => attrs.find((a) => a.type === t)?.level ?? 1
  );
  const charLevel = getCharacterLevel(levels);
  const newMaxHp  = maxHpForCharLevel(charLevel);
  if (newMaxHp !== char.maxHp) {
    await prisma.character.update({ where: { id: char.id }, data: { maxHp: newMaxHp } });
  }
}

async function syncAttrLevel(type: string) {
  const attr = await prisma.attribute.findUnique({ where: { type } });
  if (!attr) return attr;
  const { level } = getLevelInfo(attr.xp);
  if (level !== attr.level)
    return prisma.attribute.update({ where: { type }, data: { level } });
  return attr;
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────
async function checkAchievements(opts: {
  isFirstCompletion: boolean;
  streak: number;
  levelAfter: number;
  questType: string;
  questDifficulty: string;
}): Promise<string> {
  const { isFirstCompletion, streak, levelAfter, questType, questDifficulty } = opts;
  const existing = await prisma.achievement.findMany({ select: { key: true } });
  const has = new Set(existing.map((a) => a.key));

  const toUnlock: string[] = [];
  if (isFirstCompletion && !has.has("FIRST_QUEST"))          toUnlock.push("FIRST_QUEST");
  if (streak >= 3  && !has.has("STREAK_3"))                  toUnlock.push("STREAK_3");
  if (streak >= 7  && !has.has("STREAK_7"))                  toUnlock.push("STREAK_7");
  if (streak >= 14 && !has.has("STREAK_14"))                 toUnlock.push("STREAK_14");
  if (levelAfter >= 5  && !has.has("LEVEL_5"))               toUnlock.push("LEVEL_5");
  if (levelAfter >= 10 && !has.has("LEVEL_10"))              toUnlock.push("LEVEL_10");
  if (questType === "BOSS" && !has.has("BOSS_SLAYER"))        toUnlock.push("BOSS_SLAYER");
  if (questDifficulty === "HARD" && !has.has("HARD_WORKER")) toUnlock.push("HARD_WORKER");

  if (toUnlock.length > 0) {
    await prisma.achievement.createMany({ data: toUnlock.map((key) => ({ key })) });
  }
  return toUnlock[0] ?? ""; // return first new achievement (if any)
}

// ─── AUTO-FAIL ────────────────────────────────────────────────────
export async function autoFailDailies(): Promise<{ failedCount: number; streakBroken: boolean; hpLost: number }> {
  const now = new Date();
  const todayStart = brtDayStart(now);

  // Auto-create character if missing (prevents silent failures on fresh installs)
  let char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char) {
    char = await prisma.character.upsert({
      where: { id: "main" },
      update: {},
      create: { id: "main", name: "Aventureiro", hp: 100, maxHp: 100, isTest: false },
    });
  }

  if (char.lastDailyReset && new Date(char.lastDailyReset) >= todayStart) {
    return { failedCount: 0, streakBroken: false, hpLost: 0 };
  }

  const staleDailies = await prisma.quest.findMany({
    where: { type: "DAILY", status: "ACTIVE", createdAt: { lt: todayStart } },
  });

  let hpLost = 0;
  for (const q of staleDailies) {
    const loss = HP_LOSS_BY_DIFF[q.difficulty] ?? HP_LOSS;
    hpLost += loss;
    await prisma.quest.update({ where: { id: q.id }, data: { status: "FAILED", failedAt: now } });
    await prisma.questLog.create({
      data: { questId: q.id, action: "FAILED", xpChange: 0, hpChange: -loss, note: "Auto-fail: dia novo" },
    });
  }

  // Streak breaks only if user completed ZERO quests yesterday
  const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
  const completedYesterday = await prisma.questLog.count({
    where: { action: "COMPLETED", createdAt: { gte: yesterdayStart, lt: todayStart } },
  });
  const streakBroken = completedYesterday === 0 && char.streak > 0;

  await prisma.character.update({
    where: { id: char.id },
    data: {
      hp: Math.max(0, char.hp - hpLost),
      streak: streakBroken ? 0 : char.streak,
      lastDailyReset: now,
    },
  });

  await prisma.quest.updateMany({
    where: { type: "DAILY" },
    data: { status: "ACTIVE", completedAt: null, failedAt: null },
  });

  return { failedCount: staleDailies.length, streakBroken, hpLost };
}

// ─── COMPLETE QUEST ───────────────────────────────────────────────
export async function completeQuest(questId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") return;

  const xp = effectiveXP(quest.xpReward, quest.type, quest.difficulty ?? "NORMAL");

  const attrBefore = await prisma.attribute.findUnique({ where: { type: quest.attribute } });
  const levelBefore = getLevelInfo(attrBefore?.xp ?? 0).level;

  await prisma.attribute.upsert({
    where: { type: quest.attribute },
    update: { xp: { increment: xp } },
    create: { type: quest.attribute, xp, level: 1 },
  });
  const attrAfter = await syncAttrLevel(quest.attribute);
  const levelAfter = attrAfter?.level ?? levelBefore;

  // HP regen + streak
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  let newStreak = 0;
  if (char) {
    const today = brtDayStart(new Date());
    const yesterday = new Date(today.getTime() - 86_400_000);
    const last = char.lastActiveDate ? brtDayStart(new Date(char.lastActiveDate)) : null;

    newStreak = char.streak;
    if (!last || last.getTime() < yesterday.getTime()) newStreak = 1;
    else if (last.getTime() === yesterday.getTime()) newStreak = char.streak + 1;

    await prisma.character.update({
      where: { id: char.id },
      data: { hp: Math.min(char.maxHp, char.hp + HP_REGEN), streak: newStreak, lastActiveDate: new Date() },
    });
  }

  await prisma.quest.update({ where: { id: questId }, data: { status: "COMPLETED", completedAt: new Date() } });
  await prisma.questLog.create({ data: { questId, action: "COMPLETED", xpChange: xp, hpChange: HP_REGEN } });
  await syncMaxHp();

  // Check first completion
  const logCount = await prisma.questLog.count({ where: { action: "COMPLETED" } });

  const newAchievement = await checkAchievements({
    isFirstCompletion: logCount === 1,
    streak: newStreak,
    levelAfter,
    questType: quest.type,
    questDifficulty: quest.difficulty ?? "NORMAL",
  });

  const achParam = newAchievement ? `&achievement=${newAchievement}` : "";

  revalidatePath("/"); revalidatePath("/quests"); revalidatePath("/attributes");

  if (levelAfter > levelBefore) {
    redirect(`/?levelup=${quest.attribute}&newlevel=${levelAfter}&milestone=${isMilestoneLevel(levelAfter) ? "1" : "0"}${achParam}`);
  }
  if (newAchievement) redirect(`/?achievement=${newAchievement}`);
}

// ─── FAIL QUEST ───────────────────────────────────────────────────
export async function failQuest(questId: string) {
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest || quest.status !== "ACTIVE") return;

  const hpLoss = quest.type === "BOSS" ? HP_LOSS_BOSS : HP_LOSS;

  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (char) {
    await prisma.character.update({
      where: { id: char.id },
      data: { hp: Math.max(0, char.hp - hpLoss), streak: 0 },
    });
  }
  await prisma.quest.update({ where: { id: questId }, data: { status: "FAILED", failedAt: new Date() } });
  await prisma.questLog.create({ data: { questId, action: "FAILED", xpChange: 0, hpChange: -hpLoss } });
  revalidatePath("/"); revalidatePath("/quests");
}

// ─── TOGGLE SUB-TASK ──────────────────────────────────────────────
export async function toggleSubTask(subTaskId: string) {
  const sub = await prisma.subTask.findUnique({ where: { id: subTaskId } });
  if (!sub) return;
  await prisma.subTask.update({ where: { id: subTaskId }, data: { done: !sub.done } });
  revalidatePath("/quests");
}

// ─── CREATE QUEST ─────────────────────────────────────────────────
export async function createQuest(formData: FormData) {
  const title      = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type       = formData.get("type") as string;
  const difficulty = formData.get("difficulty") as string || "NORMAL";
  const attribute  = formData.get("attribute") as string;
  const xpReward   = parseInt(formData.get("xpReward") as string) || 50;
  const dueDateRaw = formData.get("dueDate") as string;
  const subTaskTitles = (formData.getAll("subTask") as string[]).map((s) => s.trim()).filter(Boolean);

  if (!title || !type || !attribute) return;

  const quest = await prisma.quest.create({
    data: {
      title, description: description || null, type, difficulty,
      attribute, xpReward, dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });

  if (subTaskTitles.length > 0) {
    await prisma.subTask.createMany({
      data: subTaskTitles.map((t, i) => ({ questId: quest.id, title: t, order: i })),
    });
  }

  revalidatePath("/quests");
  redirect("/quests");
}

// ─── UPDATE QUEST ─────────────────────────────────────────────────
export async function updateQuest(formData: FormData) {
  const questId    = formData.get("questId") as string;
  const title      = formData.get("title") as string;
  const description = formData.get("description") as string;
  const type       = formData.get("type") as string;
  const difficulty = formData.get("difficulty") as string || "NORMAL";
  const attribute  = formData.get("attribute") as string;
  const xpReward   = parseInt(formData.get("xpReward") as string) || 50;
  const dueDateRaw = formData.get("dueDate") as string;
  const subTaskTitles = (formData.getAll("subTask") as string[]).map((s) => s.trim()).filter(Boolean);

  if (!questId || !title) return;

  await prisma.quest.update({
    where: { id: questId },
    data: {
      title, description: description || null, type, difficulty,
      attribute, xpReward, dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
    },
  });

  await prisma.subTask.deleteMany({ where: { questId } });
  if (subTaskTitles.length > 0) {
    await prisma.subTask.createMany({
      data: subTaskTitles.map((t, i) => ({ questId, title: t, order: i })),
    });
  }

  revalidatePath("/quests");
  redirect("/quests");
}

// ─── DELETE QUEST ─────────────────────────────────────────────────
export async function deleteQuest(questId: string) {
  await prisma.quest.delete({ where: { id: questId } });
  revalidatePath("/"); revalidatePath("/quests");
}

// ─── MISC ─────────────────────────────────────────────────────────
export async function resetDailies() {
  await prisma.quest.updateMany({
    where: { type: "DAILY", status: { in: ["COMPLETED", "FAILED"] } },
    data: { status: "ACTIVE", completedAt: null, failedAt: null },
  });
  revalidatePath("/"); revalidatePath("/quests");
}

// ─── REST SYSTEM ──────────────────────────────────────────────────
// Called during render (like autoFailDailies) — no revalidatePath.
// Returns HP gained from rest (0 if no rest occurred).
// Skipped if user is explicitly sleeping (sleepAt set) — wakeUp() handles that.
export async function checkRest(): Promise<number> {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char || char.hp >= char.maxHp) return 0;
  if (char.sleepAt) return 0; // sleeping explicitly — wait for wakeUp()

  const now = new Date();
  const lastActive = char.lastActiveDate ? new Date(char.lastActiveDate) : null;
  if (!lastActive) return 0;

  const hoursSince = (now.getTime() - lastActive.getTime()) / 3_600_000;
  if (hoursSince < 8) return 0;

  // Only apply once per rest period: lastRestAt must be before the last active date
  if (char.lastRestAt && new Date(char.lastRestAt) >= lastActive) return 0;

  const regen =
    hoursSince >= 24 ? 35 :
    hoursSince >= 16 ? 25 : 15;

  const newHp = Math.min(char.maxHp, char.hp + regen);
  await prisma.character.update({
    where: { id: char.id },
    data: { hp: newHp, lastRestAt: now },
  });
  return regen;
}

// ─── SLEEP SYSTEM ─────────────────────────────────────────────────
export async function startSleep() {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char) return;
  await prisma.character.update({
    where: { id: char.id },
    data: { sleepAt: new Date() },
  });
  revalidatePath("/");
}

export async function wakeUp() {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char || !char.sleepAt) return 0;

  const sleptMs = Date.now() - new Date(char.sleepAt).getTime();
  const sleptH  = sleptMs / 3_600_000;
  const regen   = sleptH >= 24 ? 35 : sleptH >= 16 ? 25 : sleptH >= 8 ? 15 : 0;

  await prisma.character.update({
    where: { id: char.id },
    data: {
      hp:        Math.min(char.maxHp, char.hp + regen),
      sleepAt:   null,
      lastRestAt: regen > 0 ? new Date() : char.lastRestAt,
    },
  });
  revalidatePath("/");
  return regen;
}

// ─── UPDATE CHARACTER NAME ────────────────────────────────────────
export async function updateCharacterName(name: string) {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char) return;
  await prisma.character.update({ where: { id: char.id }, data: { name } });
  revalidatePath("/");
}

// ─── RESET CHARACTER ──────────────────────────────────────────────
export async function resetCharacter() {
  const char = await prisma.character.findFirst({ where: { isTest: false } });
  if (!char) return;
  await prisma.character.update({
    where: { id: char.id },
    data: { hp: char.maxHp, streak: 0, lastActiveDate: null, lastDailyReset: null, lastRestAt: null },
  });
  await prisma.attribute.updateMany({ data: { xp: 0, level: 1 } });
  await prisma.questLog.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.quest.updateMany({ data: { status: "ACTIVE", completedAt: null, failedAt: null } });
  revalidatePath("/"); revalidatePath("/quests"); revalidatePath("/attributes"); revalidatePath("/log");
  redirect("/");
}
