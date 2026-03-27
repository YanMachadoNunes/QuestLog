export function xpForLevel(level: number) {
  return level * 100;
}

export function getLevelInfo(totalXP: number) {
  let level = 1;
  let remaining = totalXP;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level++;
  }
  const needed = xpForLevel(level);
  return {
    level,
    currentXP: remaining,
    xpForNext: needed,
    progress: Math.round((remaining / needed) * 100),
  };
}

export function getCharacterLevel(attrLevels: number[]) {
  if (!attrLevels.length) return 1;
  return Math.max(1, Math.floor(attrLevels.reduce((a, b) => a + b, 0) / attrLevels.length));
}

// ─── CLASS SYSTEM ────────────────────────────────────────────────
export interface ClassTier {
  minLevel: number;
  name: string;
  color: string;
  rank: string;
}

export const CHAR_CLASSES: ClassTier[] = [
  { minLevel: 1,  name: "Recruta",     color: "#9ca3af", rank: "I"   },
  { minLevel: 5,  name: "Aprendiz",    color: "#60a5fa", rank: "II"  },
  { minLevel: 10, name: "Aventureiro", color: "#34d399", rank: "III" },
  { minLevel: 15, name: "Herói",       color: "#a78bfa", rank: "IV"  },
  { minLevel: 20, name: "Campeão",     color: "#f59e0b", rank: "V"   },
  { minLevel: 30, name: "Lendário",    color: "#f97316", rank: "VI"  },
  { minLevel: 50, name: "Imortal",     color: "#ec4899", rank: "VII" },
];

export const ATTR_CLASSES: Record<string, ClassTier[]> = {
  FRC: [
    { minLevel: 1,  name: "Sedentário",  color: "#fca5a5", rank: "I"   },
    { minLevel: 5,  name: "Atleta",      color: "#f87171", rank: "II"  },
    { minLevel: 10, name: "Lutador",     color: "#ef4444", rank: "III" },
    { minLevel: 20, name: "Guerreiro",   color: "#dc2626", rank: "IV"  },
    { minLevel: 30, name: "Titã",        color: "#b91c1c", rank: "V"   },
  ],
  INT: [
    { minLevel: 1,  name: "Estudante",  color: "#93c5fd", rank: "I"   },
    { minLevel: 5,  name: "Dev",        color: "#60a5fa", rank: "II"  },
    { minLevel: 10, name: "Arquiteto",  color: "#3b82f6", rank: "III" },
    { minLevel: 20, name: "Hacker",     color: "#1d4ed8", rank: "IV"  },
    { minLevel: 30, name: "Gênio",      color: "#1e40af", rank: "V"   },
  ],
  CAR: [
    { minLevel: 1,  name: "Tímido",     color: "#fdba74", rank: "I"   },
    { minLevel: 5,  name: "Vendedor",   color: "#fb923c", rank: "II"  },
    { minLevel: 10, name: "Networker",  color: "#f97316", rank: "III" },
    { minLevel: 20, name: "Influencer", color: "#ea580c", rank: "IV"  },
    { minLevel: 30, name: "Carismático",color: "#c2410c", rank: "V"   },
  ],
  DES: [
    { minLevel: 1,  name: "Amador",     color: "#67e8f9", rank: "I"   },
    { minLevel: 5,  name: "Praticante", color: "#22d3ee", rank: "II"  },
    { minLevel: 10, name: "Músico",     color: "#06b6d4", rank: "III" },
    { minLevel: 20, name: "Virtuoso",   color: "#0891b2", rank: "IV"  },
    { minLevel: 30, name: "Maestro",    color: "#0e7490", rank: "V"   },
  ],
  SAB: [
    { minLevel: 1,  name: "Ingênuo",      color: "#d8b4fe", rank: "I"   },
    { minLevel: 5,  name: "Prudente",     color: "#c084fc", rank: "II"  },
    { minLevel: 10, name: "Estrategista", color: "#a855f7", rank: "III" },
    { minLevel: 20, name: "Sábio",        color: "#9333ea", rank: "IV"  },
    { minLevel: 30, name: "Iluminado",    color: "#7e22ce", rank: "V"   },
  ],
};

export function getClass(tiers: ClassTier[], level: number): ClassTier {
  let current = tiers[0];
  for (const tier of tiers) {
    if (level >= tier.minLevel) current = tier;
    else break;
  }
  return current;
}

export function isMilestoneLevel(level: number) {
  return [5, 10, 15, 20, 30, 50].includes(level);
}

// ─── CONSTANTS ───────────────────────────────────────────────────
export const ATTR_LABELS: Record<string, string> = {
  FRC: "Força",
  INT: "Inteligência",
  CAR: "Carisma",
  DES: "Destreza",
  SAB: "Sabedoria",
};

export const ATTR_COLORS: Record<string, string> = {
  FRC: "#f87171",
  INT: "#60a5fa",
  CAR: "#fb923c",
  DES: "#22d3ee",
  SAB: "#c084fc",
};

export const ATTR_DESC: Record<string, string> = {
  FRC: "Exercício, saúde, disciplina física, esportes",
  INT: "Estudo, código, arquitetura de software",
  CAR: "Vendas, marketing, relações, liderança",
  DES: "Piano, técnica, projetos criativos",
  SAB: "Finanças, organização, decisões de vida",
};
