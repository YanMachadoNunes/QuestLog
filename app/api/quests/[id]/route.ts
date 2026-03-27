import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quest = await prisma.quest.findUnique({
    where: { id },
    include: { subTasks: { orderBy: { order: "asc" } } },
  });
  if (!quest) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    ...quest,
    dueDate: quest.dueDate?.toISOString().split("T")[0] ?? null,
  });
}
