import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create character
  await prisma.character.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", name: "Aventureiro", hp: 100, maxHp: 100 },
  });

  // Create attributes
  const attrs = ["INT", "CAR", "DES", "SAB"];
  for (const type of attrs) {
    await prisma.attribute.upsert({
      where: { type },
      update: {},
      create: { type, xp: 0, level: 1 },
    });
  }

  // Create sample quests (only if none exist)
  const questCount = await prisma.quest.count();
  if (questCount === 0) {
    const questData = [
      { title: "Commit do dia no OptiGestão", description: "Fazer pelo menos 1 commit relevante no projeto", type: "DAILY", attribute: "INT", xpReward: 50 },
      { title: "Estudar documentação Next.js", description: "30 minutos de estudo focado", type: "DAILY", attribute: "INT", xpReward: 50 },
      { title: "Praticar piano", description: "Pelo menos 20 minutos de prática", type: "DAILY", attribute: "DES", xpReward: 50 },
      { title: "Revisar finanças", description: "Checar gastos e categorizar transações", type: "DAILY", attribute: "SAB", xpReward: 50 },
      { title: "Lançar feature financeira do OptiGestão", description: "Módulo completo de controle financeiro para as óticas", type: "EPIC", attribute: "INT", xpReward: 500 },
      { title: "Fechar primeiro cliente OptiGestão", description: "Converter uma ótica em Alegre ou Guaçuí para o plano pago", type: "EPIC", attribute: "CAR", xpReward: 800 },
      { title: "Tirar Bach de cor", description: "Prelude em Dó maior — memorizar completo", type: "EPIC", attribute: "DES", xpReward: 300 },
    ];
    for (const data of questData) {
      await prisma.quest.create({ data });
    }
  }

  console.log("✅ Seed completo!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
