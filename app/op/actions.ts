"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const TEST_ATTRS = ["FRC", "INT", "CAR", "DES", "SAB"];

/** XP total necessário para atingir um nível (sum 1..level-1 * 100) */
function xpForTargetLevel(level: number): number {
  const l = Math.max(1, Math.min(level, 100));
  return Math.round(100 * (l - 1) * l / 2);
}

export async function getTestData() {
  const char = await prisma.character.findFirst({ where: { isTest: true } });
  const attrs = await prisma.attribute.findMany({ where: { type: { endsWith: "_test" } } });
  return { char, attrs };
}

export async function initTestCharacter() {
  const existing = await prisma.character.findFirst({ where: { isTest: true } });
  if (!existing) {
    await prisma.character.create({
      data: { name: "TEST", isTest: true, hp: 100, maxHp: 100, streak: 0 },
    });
  }
  for (const attr of TEST_ATTRS) {
    const key = `${attr}_test`;
    await prisma.attribute.upsert({
      where: { type: key },
      update: {},
      create: { type: key, xp: 0, level: 1 },
    });
  }
  revalidatePath("/op");
}

export async function setTestAttrLevel(attr: string, level: number) {
  const key = `${attr}_test`;
  const xp = xpForTargetLevel(level);
  await prisma.attribute.upsert({
    where: { type: key },
    update: { xp, level },
    create: { type: key, xp, level },
  });
  revalidatePath("/op");
}

export async function setTestHp(hp: number) {
  const char = await prisma.character.findFirst({ where: { isTest: true } });
  if (!char) return;
  await prisma.character.update({
    where: { id: char.id },
    data: { hp: Math.max(0, Math.min(hp, char.maxHp)) },
  });
  revalidatePath("/op");
}

export async function setTestStreak(streak: number) {
  const char = await prisma.character.findFirst({ where: { isTest: true } });
  if (!char) return;
  await prisma.character.update({
    where: { id: char.id },
    data: { streak: Math.max(0, streak) },
  });
  revalidatePath("/op");
}

export async function resetTestCharacter() {
  const char = await prisma.character.findFirst({ where: { isTest: true } });
  if (char) {
    await prisma.character.update({
      where: { id: char.id },
      data: { hp: 100, streak: 0 },
    });
  }
  await prisma.attribute.updateMany({
    where: { type: { endsWith: "_test" } },
    data: { xp: 0, level: 1 },
  });
  revalidatePath("/op");
}
