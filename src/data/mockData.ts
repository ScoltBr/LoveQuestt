export const currentUser = {
  id: "u1",
  name: "Luiz",
  email: "luiz@email.com",
  avatar: "L",
  xp: 680,
  level: 4,
  streak: 7,
  totalMissions: 142,
  completionRate: 87,
};

export const partner = {
  id: "u2",
  name: "Alice",
  avatar: "A",
  xp: 720,
  level: 4,
  streak: 5,
  completionRate: 91,
};

export const relationshipLevel = {
  current: "Parceiros",
  index: 2,
  levels: ["Início da Jornada", "Companheiros", "Parceiros", "Duo Imbatível", "Almas Gêmeas"],
  xp: 1400,
  nextLevelXp: 2000,
};

export const levelThresholds = [
  { level: 1, xp: 0 },
  { level: 2, xp: 100 },
  { level: 3, xp: 250 },
  { level: 4, xp: 500 },
  { level: 5, xp: 900 },
  { level: 6, xp: 1400 },
  { level: 7, xp: 2000 },
];

export interface Mission {
  id: string;
  name: string;
  description: string;
  xp: number;
  frequency: "diária" | "semanal";
  type: "individual" | "casal";
  completed: boolean;
  active: boolean;
}

export const todayMissions: Mission[] = [
  { id: "m1", name: "Beber 2L de água", description: "Manter-se hidratado durante o dia", xp: 15, frequency: "diária", type: "individual", completed: true, active: true },
  { id: "m2", name: "Caminhar 20 minutos", description: "Uma caminhada leve ao ar livre", xp: 20, frequency: "diária", type: "individual", completed: true, active: true },
  { id: "m3", name: "Alimentação saudável", description: "Fazer pelo menos 2 refeições saudáveis", xp: 20, frequency: "diária", type: "individual", completed: false, active: true },
  { id: "m4", name: "Arrumar a cama", description: "Começar o dia com organização", xp: 10, frequency: "diária", type: "individual", completed: true, active: true },
  { id: "m5", name: "Ler 20 minutos", description: "Ler um livro ou artigo", xp: 20, frequency: "diária", type: "individual", completed: false, active: true },
  { id: "m6", name: "Caminhar juntos", description: "Caminhada em casal", xp: 30, frequency: "diária", type: "casal", completed: false, active: true },
  { id: "m7", name: "Cozinhar juntos", description: "Preparar uma refeição a dois", xp: 35, frequency: "semanal", type: "casal", completed: false, active: true },
];

export interface Reward {
  id: string;
  name: string;
  xpCost: number;
  emoji: string;
}

export const rewardsCatalog: Reward[] = [
  { id: "r1", name: "Massagem", xpCost: 80, emoji: "💆" },
  { id: "r2", name: "Escolher filme", xpCost: 50, emoji: "🎬" },
  { id: "r3", name: "Escolher restaurante", xpCost: 100, emoji: "🍽️" },
  { id: "r4", name: "Pizza night", xpCost: 120, emoji: "🍕" },
  { id: "r5", name: "Café na cama", xpCost: 60, emoji: "☕" },
  { id: "r6", name: "Date night", xpCost: 150, emoji: "❤️" },
];

export type RedemptionStatus = "pending" | "approved" | "completed" | "cancelled" | "rejected";

export interface Redemption {
  id: string;
  rewardName: string;
  redeemedBy: string;
  xpCost: number;
  status: RedemptionStatus;
  date: string;
  emoji: string;
}

export const redemptionHistory: Redemption[] = [
  { id: "rd1", rewardName: "Massagem", redeemedBy: "Luiz", xpCost: 80, status: "pending", date: "2026-03-10", emoji: "💆" },
  { id: "rd2", rewardName: "Pizza Night", redeemedBy: "Alice", xpCost: 120, status: "approved", date: "2026-03-08", emoji: "🍕" },
  { id: "rd3", rewardName: "Escolher filme", redeemedBy: "Luiz", xpCost: 50, status: "completed", date: "2026-03-05", emoji: "🎬" },
  { id: "rd4", rewardName: "Café na cama", redeemedBy: "Alice", xpCost: 60, status: "rejected", date: "2026-03-02", emoji: "☕" },
];

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  date?: string;
}

export const achievements: Achievement[] = [
  { id: "a1", name: "Primeira Missão", description: "Complete sua primeira missão", emoji: "⭐", unlocked: true, date: "2026-01-15" },
  { id: "a2", name: "Sequência de 7", description: "7 dias seguidos de missões", emoji: "🔥", unlocked: true, date: "2026-02-01" },
  { id: "a3", name: "Centurião", description: "Ganhe 100 XP", emoji: "💯", unlocked: true, date: "2026-02-10" },
  { id: "a4", name: "Dedicação", description: "50 missões completadas", emoji: "🏆", unlocked: true, date: "2026-03-01" },
  { id: "a5", name: "Casal em Ação", description: "Primeira missão em casal", emoji: "💑", unlocked: true, date: "2026-01-20" },
  { id: "a6", name: "Recompensado", description: "Primeira recompensa resgatada", emoji: "🎁", unlocked: true, date: "2026-02-15" },
  { id: "a7", name: "Maratonista", description: "30 dias seguidos", emoji: "🏅", unlocked: false },
  { id: "a8", name: "Lendário", description: "Alcance o nível 7", emoji: "👑", unlocked: false },
];

export const weeklyGoal = {
  target: 15,
  completed: 11,
  reward: 100,
};

export const weeklyActivity = [
  { day: "Seg", you: 4, partner: 3 },
  { day: "Ter", you: 3, partner: 4 },
  { day: "Qua", you: 5, partner: 5 },
  { day: "Qui", you: 2, partner: 3 },
  { day: "Sex", you: 4, partner: 4 },
  { day: "Sáb", you: 3, partner: 2 },
  { day: "Dom", you: 0, partner: 0 },
];

export const notifications = [
  { id: "n1", message: "Alice completou 2 missões hoje.", time: "há 1h", read: false },
  { id: "n2", message: "Seu parceiro aprovou sua recompensa ❤️", time: "há 3h", read: false },
  { id: "n3", message: "🔥 7 dias de sequência! +25 XP bônus", time: "ontem", read: true },
  { id: "n4", message: "Meta semanal: 11/15 missões concluídas", time: "ontem", read: true },
];
