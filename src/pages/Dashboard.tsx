import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, Gift, BarChart3, Bell, Heart, ChevronRight, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import XpBadge from "@/components/XpBadge";
import ProgressRing from "@/components/ProgressRing";
import { useState } from "react";
import { useProfile, useCouple } from "@/hooks/useProfile";
import JoinCouple from "@/components/JoinCouple";
import { useHabits, useCompletions, useCompleteHabit } from "@/hooks/useHabits";
import { useCoupleStats } from "@/hooks/useCoupleStats";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useVibration } from "@/hooks/useVibration";

import type { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

// Saudação dinâmica por hora
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: profile, isLoading, refetch } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: habits = [] } = useHabits();
  const { data: completions = [] } = useCompletions(todayStr);
  const completeHabit = useCompleteHabit();
  const { weeklyGoal, level: relationshipLevel } = useCoupleStats();

  const [showXpPop, setShowXpPop] = useState<string | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const { success: vibrateSuccess } = useVibration();

  const toggleNotifs = () => {
    if (!showNotifs && unreadCount > 0) markRead.mutate();
    setShowNotifs(!showNotifs);
  };

  const totalCount = habits.length;
  const completedCount = completions.length;
  const todayXp = completions.reduce((a, c) => a + c.xp_earned, 0);
  const dailyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleMission = (id: string) => {
    const isCompleted = completions.some(c => c.habit_id === id && c.user_id === profile?.id);
    if (isCompleted) return;
    const habit = habits.find(h => h.id === id);
    if (habit) {
      setShowXpPop(id);
      setTimeout(() => setShowXpPop(null), 900);
      vibrateSuccess();
      completeHabit.mutate({ habit, date: todayStr });
    }
  };

  // ─── LOADING SKELETON ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-52 bg-muted animate-pulse rounded-xl" />
            <div className="h-4 w-28 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
            <div className="w-11 h-11 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[0, 1].map(i => (
            <div key={i} className="glass rounded-3xl p-5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded-lg" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        <div className="glass rounded-3xl p-5">
          <div className="h-4 w-36 bg-muted animate-pulse rounded mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-full bg-muted animate-pulse rounded-full h-3" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STATES: NO COUPLE / WAITING PARTNER ───────────────────────────────────
  if (profile && !profile.couple_id) {
    return <JoinCouple onJoined={() => refetch()} />;
  }

  if (couple && !couple.partner2_id) {
    const cancelInvite = async () => {
      try {
        await supabase.from("profiles").update({ couple_id: null }).eq("id", profile!.id);
        refetch();
        toast.info("Convite cancelado.");
      } catch {
        toast.error("Erro ao cancelar convite.");
      }
    };

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-5 min-h-[70vh]">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Heart className="w-12 h-12 text-primary fill-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-display font-black text-foreground">Aguardando seu par ❤️</h2>
        <p className="text-muted-foreground font-body text-sm max-w-[260px] leading-relaxed">
          Peça para ele(a) instalar o app e inserir o código abaixo na tela de conexão:
        </p>
        <div className="flex items-center gap-2 bg-muted/50 border border-border px-8 py-4 rounded-2xl my-2">
          <span className="font-mono text-3xl font-black tracking-widest text-foreground">{couple.invite_code}</span>
        </div>
        <Button
          className="w-full max-w-xs font-display font-black rounded-2xl"
          onClick={() => { navigator.clipboard.writeText(couple.invite_code || ""); toast.success("Código copiado!"); }}
        >
          Copiar Código
        </Button>
        <Button variant="ghost" className="w-full max-w-xs text-muted-foreground text-sm" onClick={cancelInvite}>
          Cancelar Convite
        </Button>
      </div>
    );
  }

  const progressGlowClass = dailyProgress === 100 ? "shadow-[0_0_16px_4px_hsl(var(--primary)/0.6)]" : "";

  return (
    <motion.div
      className="px-4 pt-6 space-y-4 pb-28"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground tracking-tight leading-tight">
            {getGreeting()}, <span className="text-primary">{profile?.name?.split(" ")[0] || "Jogador"}</span> ❤️
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
            Nível {profile?.level || 1} · <span className="text-xp font-bold">{profile?.xp || 0} XP</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.88 }}
            onClick={toggleNotifs}
            className="relative w-11 h-11 rounded-full glass flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-primary text-[9px] text-white font-black rounded-full flex items-center justify-center border-2 border-background"
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-love p-[2px] shadow-lg shadow-primary/20">
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-primary font-display font-black text-sm">
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── NOTIFICATIONS PANEL ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div
            key="notifs"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="glass rounded-3xl p-5 shadow-xl max-h-72 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-black text-sm text-foreground">Notificações</h3>
              <span className="text-[10px] text-muted-foreground">Recentes</span>
            </div>
            <div className="space-y-3">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-3 text-sm font-body ${n.is_read ? "opacity-50" : ""}`}>
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.type === "mission" ? "bg-primary" : n.type === "reward" ? "bg-love" : n.type === "level" ? "bg-success" : "bg-muted-foreground"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-xs leading-snug">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(n.created_at), "HH:mm")}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-muted-foreground py-4">Nenhuma notificação por enquanto. ❤️</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── STAT CARDS: STREAK & PARTNER ────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-streak/20 rounded-full blur-2xl -mt-4 -mr-4 pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-streak/10 flex items-center justify-center mb-3 border border-streak/20">
            <Flame className="w-6 h-6 text-streak" style={{ filter: "drop-shadow(0 0 6px hsl(var(--streak)))" }} />
          </div>
          <p className="font-display font-black text-2xl text-foreground leading-none">{profile?.streak || 0}</p>
          <p className="text-xs text-muted-foreground font-body mt-1">dias em sequência</p>
        </div>

        {/* Partner */}
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-20 h-20 bg-love/15 rounded-full blur-2xl -mt-4 -ml-4 pointer-events-none" />
          {partnerData ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-love/10 flex items-center justify-center mb-3 border border-love/20">
                <span className="text-love font-display font-black text-xl">{partnerData.name[0].toUpperCase()}</span>
              </div>
              <p className="font-display font-bold text-sm text-foreground leading-tight truncate">{partnerData.name}</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                🔥 {partnerData.streak} · Nv {partnerData.level}
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-display font-bold text-sm text-foreground">Sem parceiro</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Convite pendente</p>
            </>
          )}
        </div>
      </motion.div>

      {/* ─── DAILY PROGRESS ──────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-foreground text-sm">Progresso de Hoje</h2>
          <span className="text-sm font-display font-black text-xp" style={{ textShadow: "0 0 10px hsl(var(--xp)/0.6)" }}>
            +{todayXp} XP
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing progress={dailyProgress} size={60} strokeWidth={5}>
            <span className="text-[11px] font-display font-black text-foreground">{dailyProgress}%</span>
          </ProgressRing>
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full bg-gradient-to-r from-primary to-love transition-all duration-700 ease-out ${progressGlowClass}`}
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-body mt-2">
              <span className="font-black text-foreground">{completedCount}</span>/{totalCount} missões concluídas
            </p>
          </div>
        </div>
      </motion.div>

      {/* ─── TODAY'S MISSIONS ────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-black text-foreground text-sm">Missões de Hoje</h2>
          <button
            onClick={() => navigate("/app/missoes")}
            className="text-xs text-primary font-bold flex items-center gap-0.5 hover:opacity-80 transition-opacity"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {habits.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-4">Nenhuma missão ativa. Crie uma! 🎯</p>
          )}
          {habits.slice(0, 5).map(m => {
            const isCompleted = completions.some(c => c.habit_id === m.id && c.user_id === profile?.id);
            return (
              <div key={m.id} className="relative flex items-center gap-3 group">
                <motion.button
                  whileTap={{ scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 600, damping: 18 }}
                  onClick={() => toggleMission(m.id)}
                  disabled={isCompleted || completeHabit.isPending}
                  className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-sm transition-all shrink-0 ${
                    isCompleted
                      ? "bg-success border-success text-success-foreground shadow-[0_0_8px_hsl(var(--success)/0.6)]"
                      : "border-border hover:border-primary hover:bg-primary/5"
                  }`}
                >
                  {isCompleted && <span className="text-[11px] font-black">✓</span>}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-body font-medium leading-snug ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {m.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {m.type === "casal" ? (
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full bg-primary/20 border border-card flex items-center justify-center text-[8px] font-black">{(profile?.name || "V")[0]}</div>
                        <div className="w-4 h-4 rounded-full bg-love/20 border border-card flex items-center justify-center text-[8px] font-black">{(partnerData?.name || "?")[0]}</div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-black">
                        {m.type === "privada" ? "🔒" : (profile?.name || "V")[0]}
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {m.type === "casal" ? "Casal" : m.type === "individual" ? "Individual" : "Privada"}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-muted-foreground shrink-0">
                  +{m.type === "privada" ? 0 : m.xp_value} XP
                </span>

                <AnimatePresence>
                  {showXpPop === m.id && (
                    <motion.span
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -24, scale: 1.3 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7 }}
                      className="absolute right-0 -top-1 text-xp font-display font-black text-sm pointer-events-none"
                      style={{ textShadow: "0 0 10px hsl(var(--xp))" }}
                    >
                      {m.type === "privada" ? "🔒" : `+${m.xp_value} XP`}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── WEEKLY GOAL ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-black text-foreground text-sm">Meta da Semana</h2>
          <XpBadge amount={weeklyGoal.reward} />
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-secondary to-xp transition-all duration-700 ease-out"
            style={{
              width: `${weeklyGoal.target > 0 ? Math.max(0, Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)) : 0}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-body">
          <span className="font-black text-foreground">{weeklyGoal.completed}</span>/{weeklyGoal.target} missões concluídas
        </p>
      </motion.div>

      {/* ─── RELATIONSHIP LEVEL ──────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="glass rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-love/10 flex items-center justify-center border border-love/20">
            <Heart className="w-5 h-5 text-love fill-love" style={{ filter: "drop-shadow(0 0 5px hsl(var(--love)))" }} />
          </div>
          <div>
            <h2 className="font-display font-black text-foreground text-sm">Nível do Casal</h2>
            <p className="text-xs text-muted-foreground font-body">{relationshipLevel.name}</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden mb-2">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-love to-primary transition-all duration-700"
            style={{
              width: `${relationshipLevel.nextLevelXp > 0
                ? Math.max(0, Math.min((relationshipLevel.xp / relationshipLevel.nextLevelXp) * 100, 100))
                : 0}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {relationshipLevel.index < relationshipLevel.levels.length - 1
            ? <><span className="font-black text-foreground">{relationshipLevel.xp}</span>/{relationshipLevel.nextLevelXp} XP para "{relationshipLevel.levels[relationshipLevel.index + 1]}"</>
            : "Nível Máximo Atingido! ❤️"}
        </p>
      </motion.div>

      {/* ─── QUICK ACTIONS ───────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 pb-2">
        {[
          { icon: Plus, label: "Criar Missão", action: () => navigate("/app/missoes"), bg: "bg-primary/10", text: "text-primary", glow: "hsl(var(--primary)/0.5)" },
          { icon: Gift, label: "Recompensas", action: () => navigate("/app/recompensas"), bg: "bg-xp/10", text: "text-xp", glow: "hsl(var(--xp)/0.5)" },
          { icon: BarChart3, label: "Estatísticas", action: () => navigate("/app/stats"), bg: "bg-secondary/10", text: "text-secondary", glow: "hsl(var(--secondary)/0.5)" },
        ].map(a => (
          <motion.button
            key={a.label}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={a.action}
            className="glass rounded-3xl p-4 flex flex-col items-center gap-2.5 shadow-sm"
          >
            <div className={`w-11 h-11 rounded-2xl ${a.bg} flex items-center justify-center`} style={{ boxShadow: `0 0 12px ${a.glow}` }}>
              <a.icon className={`w-5 h-5 ${a.text}`} />
            </div>
            <span className="text-[9px] font-display font-black text-foreground text-center uppercase tracking-widest leading-tight">{a.label}</span>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;