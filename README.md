# QuestLog

**Um RPG de produtividade pessoal** — Transforme suas tarefas diárias em missões e acompanhe sua evolução como um personagem de RPG.

---

## Visão Geral

QuestLog é um sistema de gestão de tarefas gamificado que aplica mecânicas de RPG (XP, níveis, ranks, classes, conquistas) à produtividade pessoal. Completar tarefas concede experiência (XP), e ao subir de nível você evolui de classe e sobe no ranking global.

### Características

- **Sistema de Atributos** — 5 habilidades (FRC, INT, CAR, DES, SAB)
- **Ranks Globais** — De D até Ascendente, baseado na média dos atributos
- **Classes por Atributo** — 6 tiers a cada 20 níveis, com título de ascensão no nível 100
- **Sistema de HP** — Energia vinculada ao desempenho e descanso
- **Streak System** — Contador de dias consecutivos completando missões
- **Dailies** — Tarefas que resetam diariamente com punição de HP
- **Epic Quests** — Missões de longo prazo com subtarefas e prazo
- **Boss Quests** — Desafios com 3x XP e -30 HP ao falhar
- **Conquistas** — Medalhas por marcos alcançados
- **PWA** — Instalável como app nativo no celular e desktop

---

## Stack

| Tecnologia | Uso |
|------------|-----|
| **Next.js 15** | Framework React com App Router |
| **TypeScript** | Tipagem estática |
| **Prisma** | ORM |
| **PostgreSQL** | Banco de dados (SQLite em dev) |
| **TailwindCSS 4** | Estilização |
| **Recharts** | Gráficos de XP |

---

## Tipos de Missão

| Tipo | XP | Penalidade HP |
|------|----|---------------|
| **DAILY** | Base | -10 HP (auto-fail à meia-noite) |
| **EPIC** | Base | Nenhuma |
| **BOSS** | 3× base | -30 HP ao falhar |

### Dificuldades

| Dificuldade | Multiplicador |
|-------------|---------------|
| EASY | 0.5× |
| NORMAL | 1× |
| HARD | 2× |

---

## Sistema de Ranks e Classes

### Ranks Globais (média dos atributos)

| Rank | Nível mínimo | Cor |
|------|--------------|-----|
| D | 0 | Cinza |
| C | 5 | Azul |
| B | 10 | Verde |
| A | 15 | Roxo |
| S | 20 | Dourado |
| Nacional | 30 | Laranja |
| Monarca | 50 | Rosa |
| Ascendente | 100 | Prismático |

### Classes por Atributo (a cada 20 níveis)

```
FRC: Sedentário → Saudável → Atlético → Olímpico → Militar → [Imortal]
INT: Júnior → Pleno → Sênior → Arquiteto → Gênio → [Demiurgo]
CAR: Tímido → Vendedor → Networker → Influencer → Líder → [Ícone]
DES: Amador → Iniciante → Intermediário → Avançado → Virtuoso → [Criador]
SAB: Ingênuo → Prudente → Experto → Sábio → Iluminado → [Transcendental]
```

> Títulos entre `[ ]` são os títulos de ascensão, desbloqueados ao atingir nível 100.

### Progressão de XP

- Cada nível requer `nível × 100` XP
- Milestones em: 20, 40, 60, 80, 100

---

## Sistema de Personagem

### HP e Recuperação

- **HP máximo**: 100
- **Regeneração por missão completa**: +5 HP
- **Descanso**:
  - 8h+ inativo: +15 HP
  - 16h+ inativo: +25 HP
  - 24h+ inativo: +35 HP

### Streak

- Incrementa ao completar qualquer missão no dia
- Reseta se nenhuma daily for completada
- Cores: 3+ dias (amarelo), 7+ dias (laranja), 14+ dias (vermelho)

---

## Conquistas

| Chave | Requisito |
|-------|-----------|
| `FIRST_QUEST` | Completar primeira missão |
| `STREAK_3` | 3 dias consecutivos |
| `STREAK_7` | 7 dias consecutivos |
| `STREAK_14` | 14 dias consecutivos |
| `LEVEL_5` | Atributo nível 5 |
| `LEVEL_10` | Atributo nível 10 |
| `BOSS_SLAYER` | Completar uma Boss Quest |
| `HARD_WORKER` | Completar uma missão HARD |

---

## Como Executar

```bash
npm install

# Configurar banco
npx prisma generate
npx prisma db push

# (Opcional) Seed
npm run seed

# Dev
npm run dev
```

### Variáveis de Ambiente

```env
# Dev (SQLite)
DATABASE_URL="file:./prisma/dev.db"

# Produção (PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

---

## PWA

Instalável como app nativo via Chrome (Android/Desktop) ou Safari (iOS).

- `public/manifest.json` — Metadados do app
- `public/sw.js` — Service Worker com cache offline

---

## Licença

MIT
