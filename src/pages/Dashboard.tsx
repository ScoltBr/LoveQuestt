import { motion } from "framer-motion";
import { Flame, Plus, Gift, BarChart3, Bell, Heart, ChevronRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Removed mock notifications import
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

  const toggleNotifs = () => {
    if (!showNotifs && unreadCount > 0) {
      markRead.mutate();
    }
    setShowNotifs(!showNotifs);
  };

  const totalCount = habits.length;
  const completedCount = completions.length;
  const todayXp = completions.reduce((a, c) => a + c.xp_earned, 0);
  const dailyProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleMission = (id: string) => {
    const isCompleted = completions.some(c => c.habit_id === id && c.user_id === profile?.id);
    if (isCompleted) return;
    const habit = habits.find((h) => h.id === id);
    if (habit) {
      setShowXpPop(id);
      setTimeout(() => setShowXpPop(null), 800);
      completeHabit.mutate({ habit, date: todayStr });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center p-4">Carregando perfil...</div>;
  }

  if (profile && !profile.couple_id) {
    return <JoinCouple onJoined={() => refetch()} />;
  }

  if (couple && !couple.partner2_id) {
    const cancelInvite = async () => {
      try {
        await supabase.from("profiles").update({ couple_id: null }).eq("id", profile!.id);
        refetch();
        toast.info("Convite cancelado.");
      } catch (error) {
        toast.error("Erro ao cancelar convite.");
      }
    };

    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 min-h-[70vh]">
        <Heart className="w-16 h-16 text-primary fill-primary animate-pulse" />
        <h2 className="text-2xl font-display font-extrabold text-foreground">Aguardando Parceiro(a)</h2>
        <p className="text-muted-foreground font-body text-sm max-w-xs">
          Passo 1: Peça para seu parceiro(a) baixar o app ou acessar o site.<br/><br/>
          Passo 2: Peça para ele(a) inserir o código abaixo na tela inicial de conexão.
        </p>
        <div className="flex items-center gap-2 bg-muted px-6 py-3 rounded-2xl my-4">
          <span className="font-mono text-3xl font-bold tracking-widest">{couple.invite_code}</span>
        </div>
        <Button 
          className="w-full max-w-xs font-display font-bold rounded-xl mt-2"
          onClick={() => {
            navigator.clipboard.writeText(couple.invite_code || "");
            toast.success("Código copiado!");
          }}
        >
          Copiar Código
        </Button>
        <Button 
          variant="ghost" 
          className="w-full max-w-xs text-muted-foreground hover:text-foreground font-body text-sm mt-4"
          onClick={cancelInvite}
        >
          Cancelar Convite
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            Bom dia, {profile?.name || "Jogador"} ❤️
          </h1>
          <p className="text-sm text-muted-foreground font-body">
            Nível {profile?.level || 1} · {profile?.xp || 0} XP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleNotifs}
            className="relative w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-[10px] text-primary-foreground font-bold rounded-full flex items-center justify-center border-2 border-card">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm">
            {(profile?.name || "U")[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* Notifications dropdown */}
      {showNotifs && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-card)] max-h-[300px] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-display font-bold text-sm text-foreground">Notificações</h3>
             {notifications.length > 0 && (
                <span className="text-[10px] text-muted-foreground font-body">Mais recentes</span>
             )}
          </div>
          
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 text-sm font-body ${n.is_read ? 'opacity-60' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    n.type === 'mission' ? 'bg-primary' : 
                    n.type === 'reward' ? 'bg-love' : 
                    n.type === 'level' ? 'bg-success' : 'bg-muted'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground leading-tight text-xs">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "HH:mm")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-center text-muted-foreground font-body py-4">
                Nenhuma notificação por enquanto. ❤️
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Streak + Partner row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-streak/10 flex items-center justify-center">
            <Flame className="w-6 h-6 text-streak" />
          </div>
          <div>
            <p className="font-display font-extrabold text-xl text-foreground">{profile?.streak || 0}</p>
            <p className="text-xs text-muted-foreground font-body">dias seguidos</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-love/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-love fill-love" />
          </div>
          <div>
            <p className="font-display font-bold text-sm text-foreground">
              {partnerData?.name || "Aguardando parceiro"}
            </p>
            <p className="text-xs text-muted-foreground font-body">
              {partnerData ? `🔥 ${partnerData.streak} · Nv ${partnerData.level}` : "Convite pendente"}
            </p>
          </div>
        </div>
      </div>

      {/* Daily progress */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-foreground text-sm">Progresso de Hoje</h2>
          <span className="text-sm font-display font-bold text-xp">+{todayXp} XP</span>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing progress={dailyProgress} size={56}>
            <span className="text-xs font-display font-bold text-foreground">{dailyProgress}%</span>
          </ProgressRing>
          <div className="flex-1">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(dailyProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-body mt-1">
              {completedCount}/{totalCount} missões concluídas
            </p>
          </div>
        </div>
      </div>

      {/* Today's missions */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-foreground text-sm">Missões de Hoje</h2>
          <button
            onClick={() => navigate("/app/missoes")}
            className="text-xs text-primary font-body font-semibold flex items-center gap-0.5"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2.5">
          {habits.slice(0, 5).map((m) => {
            const isCompleted = completions.some(c => c.habit_id === m.id && c.user_id === profile?.id);
            return (
              <div key={m.id} className="relative flex items-center gap-3">
                <button
                  onClick={() => toggleMission(m.id)}
                  disabled={isCompleted || completeHabit.isPending}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs transition-all ${isCompleted
                    ? "bg-success border-success text-success-foreground"
                    : "border-border hover:border-primary"
                    }`}
                >
                  {isCompleted && "✓"}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-body ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                      }`}
                  >
                    {m.name}
                  </p>
                  {m.type === "casal" &&                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                        {m.type === 'casal' ? (
                          <div className="flex -space-x-1.5">
                            <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[8px] font-bold">{(profile?.name || "V")[0]}</div>
                            <div className="w-4 h-4 rounded-full bg-love/20 border-2 border-card flex items-center justify-center text-[8px] font-bold">{(partnerData?.name || "?")[0]}</div>
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold">{(profile?.name || "V")[0]}</div>
                        )}
                        {m.type === 'casal' ? "Casal" : "Individual"}
                      </div>
                  }
                </div>
                <span className="text-xs text-muted-foreground font-body">+{m.xp_value} XP</span>
                {showXpPop === m.id && (
                  <span className="absolute right-0 -top-2 text-xp font-display font-bold text-sm animate-xp-pop">
                    +{m.xp_value} XP
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Weekly goal */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display font-bold text-foreground text-sm">Meta da Semana</h2>
          <XpBadge amount={weeklyGoal.reward} />
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 mb-1">
          <div
            className="h-2.5 rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${Math.min((weeklyGoal.completed / weeklyGoal.target) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {weeklyGoal.completed}/{weeklyGoal.target} missões concluídas
        </p>
      </div>

      {/* Relationship level */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-5 h-5 text-love fill-love" />
          <div>
            <h2 className="font-display font-bold text-foreground text-sm">Nível do Casal</h2>
            <p className="text-xs text-muted-foreground font-body">{relationshipLevel.name}</p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5 mb-1">
          <div
            className="h-2.5 rounded-full bg-love transition-all duration-500"
            style={{ width: `${Math.min((relationshipLevel.xp / relationshipLevel.nextLevelXp) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground font-body">
          {relationshipLevel.index < relationshipLevel.levels.length - 1 
            ? `${relationshipLevel.xp}/${relationshipLevel.nextLevelXp} XP para "${relationshipLevel.levels[relationshipLevel.index + 1]}"`
            : "Nível Máximo Atingido! ❤️"
          }
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 pb-4">
        {[
          { icon: Plus, label: "Criar missão", action: () => navigate("/app/missoes"), color: "bg-primary/10 text-primary" },
          { icon: Gift, label: "Recompensas", action: () => navigate("/app/recompensas"), color: "bg-xp/10 text-xp" },
          { icon: BarChart3, label: "Estatísticas", action: () => navigate("/app/stats"), color: "bg-secondary/10 text-secondary" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={a.action}
            className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
              <a.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-body font-medium text-foreground">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
