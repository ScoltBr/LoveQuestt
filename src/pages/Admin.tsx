import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  ShieldAlert, Target, Gift, Zap, Sparkles, ChevronLeft, Trash2, Save, ShieldOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useHabits, useDeleteHabit } from "@/hooks/useHabits";
import { useRewards, useDeleteReward } from "@/hooks/useRewards";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GachaAdminModal } from "@/components/GachaAdminModal";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ─── Guard: Admin apenas para perfis com is_admin = true ─────────────────────
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
      </div>
    );
  }

  // Bloqueia acesso se não autenticado ou não for admin
  if (!session || !(profile as unknown as { is_admin?: boolean })?.is_admin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-display font-black text-foreground">Acesso Negado</h1>
        <p className="text-sm text-muted-foreground font-body max-w-xs">
          Você não tem permissão para acessar esta área. Fale com o administrador do casal.
        </p>
        <button
          onClick={() => navigate("/app")}
          className="mt-2 px-6 py-2.5 bg-primary text-white rounded-2xl font-display font-black text-sm"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
function AdminContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);

  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const { data: missions } = useHabits();
  const deleteMission = useDeleteHabit();

  const { data: rewards } = useRewards();
  const deleteReward = useDeleteReward();

  // Confirm dialogs (substituindo confirm() nativo)
  const [confirmDeleteMission, setConfirmDeleteMission] = useState<string | null>(null);
  const [confirmDeleteReward, setConfirmDeleteReward] = useState<string | null>(null);
  const [confirmGodMode, setConfirmGodMode] = useState(false);

  const updateProfile = useMutation({
    mutationFn: async ({ id, xp, streak }: { id: string; xp: number; streak: number }) => {
      const { error } = await supabase.from("profiles").update({ xp, streak }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["couple"] });
      toast.success("Dados do jogador atualizados com sucesso!");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Erro"),
  });

  const toggleGacha = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { error } = await supabase
        .from("couples")
        .update({ gacha_enabled: enabled })
        .eq("id", couple?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couple"] });
      toast.success("Status do Gacha atualizado com sucesso!");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Erro"),
  });

  const [activeTab, setActiveTab] = useState<"missoes" | "recompensas" | "godmode" | "gacha">("missoes");

  // God mode local state
  const [targetUser, setTargetUser] = useState<"me" | "partner">("partner");
  const [xpPoints, setXpPoints] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [isGachaModalOpen, setIsGachaModalOpen] = useState(false);

  return (
    <div className="px-4 pt-6 pb-20 space-y-4 max-w-lg mx-auto">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-display font-black text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6" />
            Central de Comando
          </h1>
          <p className="text-sm text-slate-400 font-body mt-1">Gerencie missões, recompensas e XP</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-rose-500/10 mb-6">
        {[
          { id: "missoes",     icon: Target,    label: "Missões" },
          { id: "recompensas", icon: Gift,       label: "Loja" },
          { id: "godmode",     icon: Zap,        label: "God Mode" },
          { id: "gacha",       icon: Sparkles,   label: "Gacha" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 rounded-xl transition-all ${
                isActive
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                  : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="glass rounded-3xl p-5 border border-rose-500/20"
        >
          {/* MISSÕES */}
          {activeTab === "missoes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Target className="text-rose-500 w-5 h-5" /> Missões Criadas
                </h3>
                <span className="text-xs text-slate-400">{missions?.length || 0} registradas</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {missions?.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{m.emoji || "🎯"}</span>
                      <div>
                        <p className="font-bold text-sm text-white">{m.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{m.frequency} • {m.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">{m.xp_value} XP</span>
                      <button
                        onClick={() => setConfirmDeleteMission(m.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {missions?.length === 0 && <p className="text-center text-slate-500 py-4">Nenhuma missão encontrada.</p>}
              </div>
            </div>
          )}

          {/* RECOMPENSAS */}
          {activeTab === "recompensas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Gift className="text-rose-500 w-5 h-5" /> Estoque da Loja
                </h3>
                <span className="text-xs text-slate-400">{rewards?.length || 0} cadastradas</span>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {rewards?.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.emoji || "🎁"}</span>
                      <div>
                        <p className="font-bold text-sm text-white">{r.name}</p>
                        <p className="text-[10px] text-slate-400">{r.is_reusable ? "Reutilizável" : "Uso Único"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">{r.cost} XP</span>
                      <button
                        onClick={() => setConfirmDeleteReward(r.id)}
                        className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {rewards?.length === 0 && <p className="text-center text-slate-500 py-4">Loja vazia.</p>}
              </div>
            </div>
          )}

          {/* GOD MODE */}
          {activeTab === "godmode" && (
            <div className="space-y-5">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <h3 className="font-bold text-rose-400 flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" /> Nível de Mestre
                </h3>
                <p className="text-xs text-rose-400/80">
                  Altere o XP ou Sequência dos jogadores para consertar erros ou dar bonificações.
                </p>
              </div>

              <div className="flex border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => { setTargetUser("me"); setXpPoints(profile?.xp || 0); setStreakDays(profile?.streak || 0); }}
                  className={`flex-1 py-2 text-sm font-bold ${targetUser === "me" ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-500"}`}
                >Eu</button>
                <button
                  onClick={() => { setTargetUser("partner"); setXpPoints(partnerData?.xp || 0); setStreakDays(partnerData?.streak || 0); }}
                  className={`flex-1 py-2 text-sm font-bold ${targetUser === "partner" ? "bg-slate-800 text-white" : "bg-slate-900 text-slate-500"}`}
                >Parceiro(a)</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">Pontos de XP Totais</label>
                  <input
                    type="number" value={xpPoints} onChange={(e) => setXpPoints(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block uppercase tracking-wider">Dias de Sequência (Streak)</label>
                  <input
                    type="number" value={streakDays} onChange={(e) => setStreakDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-white font-black"
                  />
                </div>
                <button
                  onClick={() => setConfirmGodMode(true)}
                  disabled={updateProfile.isPending}
                  className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {updateProfile.isPending ? "Salvando..." : "Aplicar Mudanças"}
                </button>
              </div>
            </div>
          )}

          {/* GACHA */}
          {activeTab === "gacha" && (
            <div className="space-y-6">
              <div className="text-center pt-4 pb-2">
                <Sparkles className="w-10 h-10 text-rose-500/50 mx-auto mb-3" />
                <p className="font-bold text-white mb-2">Pilha de Loots</p>
                <p className="text-sm text-slate-400">Configure as tabelas de queda para o sistema de Baús.</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                <div>
                  <h4 className="font-bold text-white text-sm">Gacha Ligado</h4>
                  <p className="text-[11px] text-slate-400">Desative para esconder os baús em manutenção</p>
                </div>
                <Switch
                  checked={couple?.gacha_enabled ?? true}
                  onCheckedChange={(checked) => toggleGacha.mutate(checked)}
                  disabled={toggleGacha.isPending || !couple}
                />
              </div>
              <button
                onClick={() => setIsGachaModalOpen(true)}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
              >
                Abrir Painel de Loots
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <GachaAdminModal isOpen={isGachaModalOpen} onClose={() => setIsGachaModalOpen(false)} />

      {/* CONFIRM: Deletar missão */}
      <AlertDialog open={!!confirmDeleteMission} onOpenChange={(o) => !o && setConfirmDeleteMission(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black">Arquivar Missão?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              A missão será desativada. Esta ação pode ser revertida editando o banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-display font-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive font-display font-black"
              onClick={() => { if (confirmDeleteMission) deleteMission.mutate(confirmDeleteMission); setConfirmDeleteMission(null); }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRM: Deletar recompensa */}
      <AlertDialog open={!!confirmDeleteReward} onOpenChange={(o) => !o && setConfirmDeleteReward(null)}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black">Remover da Loja?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              A recompensa será removida permanentemente do catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-display font-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive font-display font-black"
              onClick={() => { if (confirmDeleteReward) deleteReward.mutate(confirmDeleteReward); setConfirmDeleteReward(null); }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRM: God Mode */}
      <AlertDialog open={confirmGodMode} onOpenChange={setConfirmGodMode}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black text-rose-500">Aplicar God Mode?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Você vai forçar {xpPoints} XP e {streakDays} dias de streak para{" "}
              {targetUser === "me" ? "você" : partnerData?.name || "o parceiro"}. Tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-display font-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-rose-500 font-display font-black"
              onClick={() => {
                const id = targetUser === "me" ? profile?.id : partnerData?.id;
                if (id) updateProfile.mutate({ id, xp: xpPoints, streak: streakDays });
                setConfirmGodMode(false);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Admin() {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
}
