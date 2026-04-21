import { useProfile } from "@/hooks/useProfile";
import { usePartner } from "@/hooks/usePartner";
import { motion, AnimatePresence } from "framer-motion";
import { useCoupleStats } from "@/hooks/useCoupleStats";
import { useAchievements, useWeeklyComparison } from "@/hooks/useActivity";
import { useHabits, useCompletions, ACHIEVEMENTS_CATALOG } from "@/hooks/useHabits";
import { format } from "date-fns";
import { Trophy, Flame, Target, Sparkles, TrendingUp, Crown, LineChart as ChartIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { GachaSystem } from "@/components/GachaSystem";


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
  const { partnerData } = usePartner();
  const { weeklyGoal } = useCoupleStats();
  const { data: unlockedAchievements = [] } = useAchievements();
  const { data: habits = [] } = useHabits();
  const { data: todayCompletions = [] } = useCompletions(format(new Date(), "yyyy-MM-dd"));

  // Weekly Comparison Data
  const { data: weeklyData } = useWeeklyComparison();
  const chartData = weeklyData?.chartData || [];
  const userTotal = weeklyData?.userTotal || { xp: 0, missions: 0 };
  const partnerTotal = weeklyData?.partnerTotal || { xp: 0, missions: 0 };

  const totalCount = habits.length;
  const completedCount = todayCompletions.length;
  const dailyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Usa o catálogo centralizado de conquistas (fonte única da verdade)
  const achievementsList = ACHIEVEMENTS_CATALOG;

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

      {/* Sala de Baús (Gacha) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GachaSystem />
      </motion.div>

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
