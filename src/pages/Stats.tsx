import { useProfile, useCouple } from "@/hooks/useProfile";
import { motion, AnimatePresence } from "framer-motion";
import { useCoupleStats } from "@/hooks/useCoupleStats";
import { useActivityData, useAchievements, useWeeklyComparison } from "@/hooks/useActivity";
import { useHabits, useCompletions } from "@/hooks/useHabits";
import { format } from "date-fns";
import { Trophy, Flame, Target, Sparkles, TrendingUp, Crown, LineChart as ChartIcon } from "lucide-react";
import ProgressRing from "@/components/ProgressRing";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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
    <div className="glass rounded-2xl p-4">
      <h2 className="font-display font-bold text-foreground text-sm mb-3">Histórico de Atividade</h2>
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
                  <div className={`absolute left-1/2 -translate-x-1/2 hidden group-hover:block z-50 pointer-events-none ${di < 3 ? "top-full mt-1.5" : "bottom-full mb-1.5"
                    }`}>
                    {di < 3 && <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mb-1" />}
                    <div className="bg-foreground text-background text-[10px] font-body rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      <p className="font-bold">{day.date}</p>
                      <p>{day.missions} {day.missions === 1 ? "missão" : "missões"}</p>
                    </div>
                    {di >= 3 && <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />}
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border shadow-xl rounded-xl p-3">
        <p className="font-display font-bold text-foreground mb-2 text-xs">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-body text-foreground">
              {entry.name}: <strong className="font-display">{entry.value} XP</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Stats = () => {
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { weeklyGoal } = useCoupleStats();
  const { data: activityData = [] } = useActivityData();
  const { data: unlockedAchievements = [] } = useAchievements();
  const { data: habits = [] } = useHabits();
  const { data: todayCompletions = [] } = useCompletions(format(new Date(), "yyyy-MM-dd"));

  // Weekly Comparison Data
  const { data: weeklyData } = useWeeklyComparison();
  const chartData = weeklyData?.chartData || [];
  const userTotal = weeklyData?.userTotal || { xp: 0, missions: 0 };
  const partnerTotal = weeklyData?.partnerTotal || { xp: 0, missions: 0 };
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const totalCount = habits.length;
  const completedCount = todayCompletions.length;
  const dailyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  const userWon = userTotal.xp > partnerTotal.xp;
  const isTie = userTotal.xp === partnerTotal.xp && userTotal.xp > 0;

  return (
    <div className="px-4 pt-6 space-y-4 pb-20"> {/* pb-20 so it doesn't collide with BottomNav */}
      <h1 className="text-2xl font-extrabold text-foreground">Estatísticas</h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid grid-cols-2 gap-3"
      >
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-4 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-extrabold text-lg text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground font-body">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Podium and Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <ChartIcon className="w-4 h-4 text-primary" />
            Corrida de Combos (Últimos 7 dias)
          </h2>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-6 h-36 mt-8 relative">
          {/* Partner Column */}
          <div className="flex flex-col items-center relative z-10 w-24">
            {!userWon && !isTie && partnerTotal.xp > 0 && (
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Crown className="w-6 h-6 text-warning mb-1 drop-shadow-md" />
              </motion.div>
            )}
            <div className="w-12 h-12 rounded-full bg-love/20 flex items-center justify-center mx-auto mb-2 text-love font-display font-extrabold shadow-lg shadow-love/10 border-2 border-love/30 bg-background z-20">
              {(partnerData?.name || "?")[0].toUpperCase()}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: userWon ? 70 : (isTie ? 90 : 110) }}
              className={`w-full rounded-t-2xl bg-gradient-to-t from-love/5 to-love/20 border-t-2 border-love/50 flex flex-col items-center justify-end pb-3`}
            >
              <span className="font-display font-black text-foreground text-sm">{partnerTotal.xp} XP</span>
              <span className="text-[10px] text-muted-foreground font-body font-medium">{partnerTotal.missions} mis.</span>
            </motion.div>
          </div>

          {/* User Column */}
          <div className="flex flex-col items-center relative z-10 w-24">
            {userWon && !isTie && userTotal.xp > 0 && (
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Crown className="w-6 h-6 text-warning mb-1 drop-shadow-md" />
              </motion.div>
            )}
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2 text-primary font-display font-extrabold shadow-lg shadow-primary/10 border-2 border-primary/30 bg-background z-20">
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: userWon ? 110 : (isTie ? 90 : 70) }}
              className={`w-full rounded-t-2xl bg-gradient-to-t from-primary/5 to-primary/20 border-t-2 border-primary/50 flex flex-col items-center justify-end pb-3`}
            >
              <span className="font-display font-black text-foreground text-sm">{userTotal.xp} XP</span>
              <span className="text-[10px] text-muted-foreground font-body font-medium">{userTotal.missions} mis.</span>
            </motion.div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[200px] w-full mt-8 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" name={profile?.name || "Você"} dataKey="userXP" stroke="hsl(var(--primary))" strokeWidth={4} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" name={partnerData?.name || "Parceiro"} dataKey="partnerXP" stroke="hsl(var(--love))" strokeWidth={4} dot={{ r: 4, fill: "hsl(var(--background))", strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Weekly goal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4"
      >
        <h2 className="font-display font-bold text-foreground text-sm mb-3">Meta Semanal do Casal</h2>
        <div className="flex items-center gap-4">
          <ProgressRing progress={weeklyGoal.target > 0 ? (weeklyGoal.completed / weeklyGoal.target) * 100 : 0} size={64}>
            <span className="text-sm font-display font-bold text-foreground">
              {weeklyGoal.completed}/{weeklyGoal.target}
            </span>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-body text-sm text-foreground">
              Completar {weeklyGoal.target} missões juntos
            </p>
            <p className="text-xs text-muted-foreground font-body">
              Recompensa: +{weeklyGoal.reward} XP para os dois!
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-secondary transition-all"
                style={{ width: `${weeklyGoal.target > 0 ? Math.max(0, Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* GitHub-style activity grid */}
      <ActivityGrid data={activityData} />

      {/* Achievements Room */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 pb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            Sala de Troféus
          </h2>
          <span className="text-xs font-body font-bold text-muted-foreground bg-accent px-2 py-1 rounded-full">
            {unlockedAchievements.length} / {achievementsList.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {achievementsList.map((a) => {
            const isUnlocked = unlockedAchievements.some(ua => ua.title === a.title);
            return (
              <motion.div
                key={a.title}
                whileHover={isUnlocked ? { scale: 1.02 } : {}}
                className={`relative overflow-hidden glass rounded-xl p-3 flex flex-col gap-2 transition-all ${isUnlocked
                    ? "border-t-[3px] border-warning/50 shadow-lg shadow-warning/5 bg-gradient-to-b from-warning/5 to-transparent"
                    : "opacity-40 grayscale border border-border bg-card/50"
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl ${isUnlocked ? 'bg-background shadow-inner' : 'bg-muted'}`}>
                    {a.emoji}
                  </div>
                  {isUnlocked && (
                    <Trophy className="w-3 h-3 text-warning/50 mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 mt-1">
                  <p className={`font-display font-extrabold text-xs truncate ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{a.title}</p>
                  <p className="text-[10px] text-muted-foreground font-body leading-tight mt-0.5 line-clamp-2">{a.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default Stats;
