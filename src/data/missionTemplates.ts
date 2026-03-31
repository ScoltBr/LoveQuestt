export interface MissionTemplate {
  id: string;
  name: string;
  category: string;
  xp_value: number;
  frequency: "daily" | "weekly" | "monthly";
  type: "individual" | "casal";
  icon: string; // Emoji
}

export const missionTemplates: MissionTemplate[] = [
  {
    id: "t1",
    name: "Limpar a casa",
    category: "Tarefas de Casa",
    xp_value: 30,
    frequency: "weekly",
    type: "individual",
    icon: "🧹"
  },
  {
    id: "t2",
    name: "Arrumar o quarto",
    category: "Tarefas de Casa",
    xp_value: 15,
    frequency: "daily",
    type: "individual",
    icon: "🛏️"
  },
  {
    id: "t3",
    name: "Lavar o banheiro",
    category: "Tarefas de Casa",
    xp_value: 40,
    frequency: "weekly",
    type: "individual",
    icon: "🚿"
  },
  {
    id: "t4",
    name: "Lavar a louça",
    category: "Tarefas de Casa",
    xp_value: 20,
    frequency: "daily",
    type: "individual",
    icon: "🍽️"
  },
  {
    id: "t5",
    name: "Preparar o jantar juntos",
    category: "Tempo de Qualidade",
    xp_value: 50,
    frequency: "weekly",
    type: "casal",
    icon: "👨‍🍳"
  },
  {
    id: "t6",
    name: "Noite de filme (Cinema em Casa)",
    category: "Romance",
    xp_value: 40,
    frequency: "weekly",
    type: "casal",
    icon: "🎬"
  },
  {
    id: "t7",
    name: "Fazer massagem no parceiro(a)",
    category: "Romance",
    xp_value: 40,
    frequency: "weekly",
    type: "individual",
    icon: "💆"
  },
  {
    id: "t8",
    name: "Deixar uma cartinha surpresa",
    category: "Romance",
    xp_value: 30,
    frequency: "weekly",
    type: "individual",
    icon: "💌"
  },
  {
    id: "t9",
    name: "Fazer exercícios juntos",
    category: "Bem-estar",
    xp_value: 40,
    frequency: "daily",
    type: "casal",
    icon: "🏃"
  },
  {
    id: "t10",
    name: "Compras no mercado",
    category: "Tarefas de Casa",
    xp_value: 30,
    frequency: "weekly",
    type: "casal",
    icon: "🛒"
  }
];
