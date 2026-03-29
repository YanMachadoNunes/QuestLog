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

// ─── GLOBAL RANKS (baseado na média dos atributos) ────────────────
export const CHAR_CLASSES: ClassTier[] = [
  { minLevel: 0,   name: "D",          color: "#9ca3af", rank: "D"          },
  { minLevel: 5,   name: "C",          color: "#60a5fa", rank: "C"          },
  { minLevel: 10,  name: "B",          color: "#34d399", rank: "B"          },
  { minLevel: 15,  name: "A",          color: "#a78bfa", rank: "A"          },
  { minLevel: 20,  name: "S",          color: "#f59e0b", rank: "S"          },
  { minLevel: 30,  name: "Nacional",   color: "#f97316", rank: "Nacional"   },
  { minLevel: 50,  name: "Monarca",    color: "#ec4899", rank: "Monarca"    },
  { minLevel: 100, name: "Ascendente", color: "#e879f9", rank: "Ascendente" },
];

// ─── TÍTULOS DE ASCENSÃO (nível 100 por atributo) ────────────────
export const ASCENSION_TITLES: Record<string, string> = {
  FRC: "Imortal",
  INT: "Demiurgo",
  CAR: "Ícone",
  DES: "Criador",
  SAB: "Transcendental",
};

// ─── CLASSES POR ATRIBUTO (tiers a cada 20 níveis) ───────────────
export const ATTR_CLASSES: Record<string, ClassTier[]> = {
  FRC: [
    { minLevel: 0,   name: "Sedentário", color: "#fca5a5", rank: "I"   },
    { minLevel: 20,  name: "Saudável",   color: "#f87171", rank: "II"  },
    { minLevel: 40,  name: "Atlético",   color: "#ef4444", rank: "III" },
    { minLevel: 60,  name: "Olímpico",   color: "#dc2626", rank: "IV"  },
    { minLevel: 80,  name: "Militar",    color: "#b91c1c", rank: "V"   },
    { minLevel: 100, name: "Imortal",    color: "#ff6b6b", rank: "VI"  },
  ],
  INT: [
    { minLevel: 0,   name: "Júnior",     color: "#93c5fd", rank: "I"   },
    { minLevel: 20,  name: "Pleno",      color: "#60a5fa", rank: "II"  },
    { minLevel: 40,  name: "Sênior",     color: "#3b82f6", rank: "III" },
    { minLevel: 60,  name: "Arquiteto",  color: "#1d4ed8", rank: "IV"  },
    { minLevel: 80,  name: "Gênio",      color: "#1e40af", rank: "V"   },
    { minLevel: 100, name: "Demiurgo",   color: "#818cf8", rank: "VI"  },
  ],
  CAR: [
    { minLevel: 0,   name: "Tímido",     color: "#fdba74", rank: "I"   },
    { minLevel: 20,  name: "Vendedor",   color: "#fb923c", rank: "II"  },
    { minLevel: 40,  name: "Networker",  color: "#f97316", rank: "III" },
    { minLevel: 60,  name: "Influencer", color: "#ea580c", rank: "IV"  },
    { minLevel: 80,  name: "Líder",      color: "#c2410c", rank: "V"   },
    { minLevel: 100, name: "Ícone",      color: "#fbbf24", rank: "VI"  },
  ],
  DES: [
    { minLevel: 0,   name: "Amador",         color: "#67e8f9", rank: "I"   },
    { minLevel: 20,  name: "Iniciante",       color: "#22d3ee", rank: "II"  },
    { minLevel: 40,  name: "Intermediário",   color: "#06b6d4", rank: "III" },
    { minLevel: 60,  name: "Avançado",        color: "#0891b2", rank: "IV"  },
    { minLevel: 80,  name: "Virtuoso",        color: "#0e7490", rank: "V"   },
    { minLevel: 100, name: "Criador",         color: "#a5f3fc", rank: "VI"  },
  ],
  SAB: [
    { minLevel: 0,   name: "Ingênuo",        color: "#d8b4fe", rank: "I"   },
    { minLevel: 20,  name: "Prudente",       color: "#c084fc", rank: "II"  },
    { minLevel: 40,  name: "Experto",        color: "#a855f7", rank: "III" },
    { minLevel: 60,  name: "Sábio",          color: "#9333ea", rank: "IV"  },
    { minLevel: 80,  name: "Iluminado",      color: "#7e22ce", rank: "V"   },
    { minLevel: 100, name: "Transcendental", color: "#e879f9", rank: "VI"  },
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

// ─── FUNÇÕES DO ENGINE ────────────────────────────────────────────

/** Retorna o título do atributo baseado no nível */
export function getAttributeTitle(attr: keyof typeof ATTR_CLASSES, level: number): string {
  if (level >= 100) return ASCENSION_TITLES[attr];
  const tiers = ATTR_CLASSES[attr];
  return getClass(tiers, level).name;
}

/** Retorna o rank global baseado na média dos níveis */
export function getGlobalRank(averageLevel: number): ClassTier {
  return getClass(CHAR_CLASSES, averageLevel);
}

/** Verifica se todos os atributos atingiram nível 100 (condição de ascensão) */
export function canAscend(stats: Record<string, number>): boolean {
  return Object.values(stats).every((lvl) => lvl >= 100);
}

export function isMilestoneLevel(level: number) {
  return [20, 40, 60, 80, 100].includes(level);
}

// maxHp scales with character level: 100 base + 5 per level above 1
export function maxHpForCharLevel(charLevel: number): number {
  return 100 + (charLevel - 1) * 5;
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
