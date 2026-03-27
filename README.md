# QuestLog

**Um RPG de produtividade pessoal** — Transforme suas tarefas diárias em missões e acompanhe sua evolução como um personagem de RPG.

---

## 🎮 Visão Geral

QuestLog é um sistema de gestão de tarefas gamificado que aplica mecânicas de RPG (XP, níveis, classes, conquistas) à produtividade pessoal. Completar tarefas concede experiência (XP), e ao subir de nível você desbloqueia novas classes e habilidades.

### Características Principais

- **Sistema de Atributos** — 5 habilidades (Força, Inteligência, Carisma, Destreza, Sabedoria)
- **Classes por Nível** — Evolução visual do personagem de Recruta a Lendário
- **Sistema de HP** — Energia do personagem vinculada ao desempenho
- **Streak System** — Contador de dias consecutivos cumprindo missões
- **Missões Diárias (Dailies)** — Tarefas que resetam diariamente com punição de HP
- **Epic Quests** — Missões de longo prazo
- **Boss Quests** — Desafios difíceis com maior recompensa e risco
- **Sistema de Conquistas** — Medalhas por marcos alcançados

---

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|------------|-----|
| **Next.js 15** | Framework React com App Router |
| **TypeScript** | Tipagem estática |
| **Prisma** | ORM para banco de dados |
| **SQLite** | Banco de dados local |
| **TailwindCSS 4** | Estilização |
| **Recharts** | Gráficos de XP |
| **Lucide React** | Ícones |

---

## 📁 Estrutura do Projeto

```
questlog/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── quests/
│   │   ├── page.tsx         # Lista de missões
│   │   ├── new/page.tsx     # Criar nova missão
│   │   └── [id]/edit/page.tsx  # Editar missão
│   ├── attributes/page.tsx   # Página de atributos
│   ├── log/page.tsx         # Log de atividades
│   └── api/
│       └── quests/[id]/route.ts  # API REST
├── components/
│   ├── QuestCard.tsx        # Card de missão
│   ├── FilterBar.tsx        # Filtro de missões
│   ├── AttributeCard.tsx    # Card de atributo
│   ├── StatBar.tsx         # Barra de progresso (HP/XP)
│   ├── XPChart.tsx         # Gráfico semanal de XP
│   ├── ActivityCalendar.tsx # Calendário de atividade
│   └── ResetModal.tsx       # Modal de reset
├── lib/
│   ├── prisma.ts           # Cliente Prisma
│   ├── actions.ts          # Server Actions (lógica de negócio)
│   └── xp.ts               # Cálculos de XP e classes
└── prisma/
    ├── schema.prisma        # Schema do banco
    └── seed.ts             # Dados iniciais
```

---

## 🎯 Tipos de Missão

| Tipo | Descrição | Recompensa XP | Penalidade HP |
|------|-----------|---------------|---------------|
| **DAILY** | Tarefas diárias, resetam às 24h | Base | -10 HP (auto-fail) |
| **EPIC** | Missões de longo prazo | Base | Nenhuma |
| **BOSS** | Desafios difíceis | 3x base | -30 HP (fail) |

### Dificuldades

| Dificuldade | Multiplicador XP |
|-------------|------------------|
| **EASY** | 0.5x |
| **NORMAL** | 1x |
| **HARD** | 2x |

---

## 📊 Sistema de Atributos

Cada atributo representa uma área da vida:

| Atributo | Cor | Descrição |
|----------|-----|-----------|
| **FRC** (Força) | 🔴 Vermelho | Exercício, saúde, disciplina física |
| **INT** (Inteligência) | 🔵 Azul | Estudo, código, arquitetura |
| **CAR** (Carisma) | 🟠 Laranja | Vendas, marketing, liderança |
| **DES** (Destreza) | 🔵 Ciano | Piano, técnica, projetos criativos |
| **SAB** (Sabedoria) | 🟣 Roxo | Finanças, organização |

### Progressão por Nível

- Cada nível requer `nível × 100` XP
- Exemplo: Lv.2 = 100 XP, Lv.3 = 200 XP adicional, etc.

### Classes de Atributos

Cada atributo evolui visualmente com classes:

```
FRC: Sedentário → Atleta → Lutador → Guerreiro → Titã
INT: Estudante → Dev → Arquiteto → Hacker → Gênio
CAR: Tímido → Vendedor → Networker → Influencer → Carismático
DES: Amador → Praticante → Músico → Virtuoso → Maestro
SAB: Ingênuo → Prudente → Estrategista → Sábio → Iluminado
```

---

## 👤 Sistema de Personagem

### Nível do Personagem

O nível do personagem é a **média dos níveis dos atributos**.

### Classes do Personagem

| Nível | Classe | Cor |
|-------|--------|-----|
| 1-4 | Recruta | Cinza |
| 5-9 | Aprendiz | Azul |
| 10-14 | Aventureiro | Verde |
| 15-19 | Herói | Roxo |
| 20-29 | Campeão | Dourado |
| 30-49 | Lendário | Laranja |
| 50+ | Imortal | Rosa |

### HP e Recuperação

- **HP máximo**: 100
- **Regeneração por missão**: +5 HP
- **Recuperação por descanso**:
  - 8h+ inativo: +15 HP
  - 16h+ inativo: +25 HP
  - 24h+ inativo: +35 HP

### Sistema de Streak

- Contador de dias consecutivos completando dailies
- Reseta ao falhar uma daily ou não completar nenhuma
- Cores especiais no dashboard:
  - 🔴 14+ dias
  - 🟠 7-13 dias
  - 🟡 3-6 dias

---

## 🏆 Sistema de Conquistas

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

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar tabelas no banco
npx prisma db push

# (Opcional) Popular com dados iniciais
npm run seed
```

### 3. Iniciar Servidor

```bash
npm run dev
```

Acesse http://localhost:3000

---

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Iniciar em modo desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Iniciar servidor de produção |
| `npm run seed` | Popular banco com dados iniciais |
| `npm run db:push` | Sincronizar schema com banco |
| `npm run db:studio` | Abrir Prisma Studio (GUI do banco) |

---

## 🔧 Variáveis de Ambiente

```env
DATABASE_URL="file:./prisma/dev.db"
```

O banco SQLite é criado automaticamente em `prisma/dev.db`.

---

## 🎨 Design System

### Cores por Tema

| Cor | Uso | Hex |
|-----|-----|-----|
| **Background** | Fundo principal | `#0a0a0a` |
| **Card** | Cartões de missão | `#111111` |
| **Border** | Bordas | `#1c1c1c` |
| **Text Primary** | Texto principal | `#e5e5e5` |
| **Text Secondary** | Texto secundário | `#555555` |
| **XP** | Experiência | `#f59e0b` |
| **HP** | Vida | `#22c55e` |
| **Danger** | Falha/Penalidade | `#ef4444` |

### Animações

- `animate-float-in`: Fade in com slide para cima
- `animate-slide-right`: Slide da direita
- `glow-pulse`: Efeito de brilho pulsante

---

## 📱 PWA (Progressive Web App)

O projeto inclui suporte a PWA:

- `public/manifest.json` — Metadados do app
- `public/sw.js` — Service Worker para offline

### Instalação

1. Abrir no Chrome/Edge
2. Clicar em "Instalar" no ícone de app
3. Funciona offline após primeira visita

---

## 🔄 Fluxo de Dados

```
┌─────────────┐     Server Actions      ┌─────────────┐
│   UI/React  │ ──────────────────────→ │   Prisma    │
│  (Client)   │ ←────────────────────── │   SQLite    │
└─────────────┘    Revalidate Path     └─────────────┘
```

### Server Actions (lib/actions.ts)

Todas as mutações são feitas via Server Actions:

- `completeQuest(questId)` — Completa missão, dá XP
- `failQuest(questId)` — Falha missão, pierde HP
- `createQuest(formData)` — Cria nova missão
- `updateQuest(formData)` — Atualiza missão
- `deleteQuest(questId)` — Remove missão
- `autoFailDailies()` — Falha dailies não completadas
- `resetDailies()` — Reseta dailies completadas
- `checkRest()` — Aplica regeneração de HP

---

## 🔮 Funcionalidades Futuras

- [ ] Dashboard financeiro integrado
- [ ] Integração com Calendário
- [ ] Sistema de equipamentos/itens
- [ ] Missões cooperativas (multiplayer)
- [ ] backup/restore de dados
- [ ] Temas claro/escuro
- [ ] Notificações push
- [ ] Sincronização entre dispositivos

---

## 📄 Licença

MIT
#   Q u e s t L o g  
 