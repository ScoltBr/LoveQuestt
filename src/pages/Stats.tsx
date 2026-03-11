import { useProfile, useCouple } from "@/hooks/useProfile";
import { useCoupleStats } from "@/hooks/useCoupleStats";
import { useActivityData, useAchievements } from "@/hooks/useActivity";
import { useHabits, useCompletions } from "@/hooks/useHabits";
import { format } from "date-fns";
import { Trophy, Flame, Target, Sparkles, TrendingUp } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";

const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const levelColors = [
  "bg-muted",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
];

const ActivityGrid = ({ data }: { data: any[][] }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h2 className="font-display font-bold text-foreground text-sm mb-3">Atividade da Semana</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((d, i) => (
              <span key={i} className="text-[10px] text-muted-foreground font-body h-[14px] flex items-center">
                {i % 2 === 0 ? d : ""}
              </span>
            ))}
          </div>
          {data.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className="relative group"
                >
                  <div
                    className={`w-[14px] h-[14px] rounded-[3px] ${levelColors[day.level]} transition-colors cursor-pointer`}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 pointer-events-none">
                    <div className="bg-foreground text-background text-[10px] font-body rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{day.date}</p>
                      <p>{day.missions} {day.missions === 1 ? "missão" : "missões"}</p>
                    </div>
                    <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground font-body mr-1">Menos</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-muted-foreground font-body ml-1">Mais</span>
      </div>
    </div>
  );
};

const Stats = () => {
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { weeklyGoal } = useCoupleStats();
  const { data: activityData = [] } = useActivityData();
  const { data: unlockedAchievements = [] } = useAchievements();
  const { data: habits = [] } = useHabits();
  const { data: todayCompletions = [] } = useCompletions(format(new Date(), "yyyy-MM-dd"));

  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const totalCount = habits.length;
  const completedCount = todayCompletions.length;
  const dailyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const completedOverall = (activityData as any[][]).flat().reduce((a, c) => a + (c.missions || 0), 0);
  const totalPotential = totalCount * 84; // 12 weeks
  const globalCompletionRate = totalPotential > 0 ? Math.round((completedOverall / totalPotential) * 100) : 0;

  // Static list of possible achievements to show unlocked/locked state
  const achievementsList = [
    { title: "Primeira Missão", description: "Complete sua primeira missão", emoji: "⭐" },
    { title: "Sequência de 7", description: "7 dias seguidos de missões", emoji: "🔥" },
    { title: "Centurião", description: "Ganhe 100 XP", emoji: "💯" },
    { title: "Dedicação", description: "50 missões completadas", emoji: "🏆" },
    { title: "Casal em Ação", description: "Primeira missão em casal", emoji: "💑" },
    { title: "Recompensado", description: "Primeira recompensa resgatada", emoji: "🎁" },
    { title: "Maratonista", description: "30 dias seguidos", emoji: "🏅" },
    { title: "Lendário", description: "Alcance o nível 7", emoji: "👑" },
  ];

  const statCards = [
    { label: "XP Total", value: `${profile?.xp || 0}`, icon: Sparkles, color: "bg-xp/10 text-xp" },
    { label: "Nível", value: `${profile?.level || 1}`, icon: TrendingUp, color: "bg-secondary/10 text-secondary" },
    { label: "Sequência", value: `${profile?.streak || 0} 🔥`, icon: Flame, color: "bg-streak/10 text-streak" },
    { label: "Conclusão", value: `${dailyProgress}%`, icon: Target, color: "bg-success/10 text-success" },
  ];


  return (
    <div className="px-4 pt-6 space-y-4 pb-4">
      <h1 className="text-2xl font-extrabold text-foreground">Estatísticas</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-extrabold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly goal */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-display font-bold text-foreground text-sm mb-3">Meta Semanal</h2>
        <div className="flex items-center gap-4">
          <ProgressRing progress={(weeklyGoal.completed / weeklyGoal.target) * 100} size={64}>
            <span className="text-sm font-display font-bold text-foreground">
              {weeklyGoal.completed}/{weeklyGoal.target}
            </span>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-body text-sm text-foreground">
              Completar {weeklyGoal.target} missões
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Recompensa: +{weeklyGoal.reward} XP
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="h-2 rounded-full bg-secondary transition-all"
                style={{ width: `${(weeklyGoal.completed / weeklyGoal.target) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GitHub-style activity grid */}
      <ActivityGrid data={activityData} />

      {/* Partner comparison */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-display font-bold text-foreground text-sm mb-3">Vocês Juntos</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-display font-bold">
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
            <p className="font-display font-bold text-sm text-foreground">{profile?.name || "Você"}</p>
            <p className="text-xs text-muted-foreground font-body">Nv {profile?.level || 1} · {profile?.xp || 0} XP</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-love/10 flex items-center justify-center mx-auto mb-2 text-love font-display font-bold">
              {(partnerData?.name || "?")[0].toUpperCase()}
            </div>
            <p className="font-display font-bold text-sm text-foreground">{partnerData?.name || "Parceiro"}</p>
            <p className="text-xs text-muted-foreground font-body">Nv {partnerData?.level || 1} · {partnerData?.xp || 0} XP</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-display font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          Conquistas
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {achievementsList.map((a) => {
            const isUnlocked = unlockedAchievements.some(ua => ua.title === a.title);
            return (
              <div
                key={a.title}
                className={`flex flex-col items-center text-center gap-1 ${
                  isUnlocked ? "" : "opacity-30 grayscale"
                }`}
              >
                <span className="text-2xl">{a.emoji}</span>
                <span className="text-[10px] font-body text-foreground leading-tight">{a.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stats;
