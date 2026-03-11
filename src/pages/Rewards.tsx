import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, X, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { useRewards, useCreateReward, useRedeemReward, useApproveReward, useRejectReward, useCompleteReward, Reward } from "@/hooks/useRewards";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Rewards = () => {
  const [tab, setTab] = useState<"catalogo" | "historico">("catalogo");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmRedeem, setConfirmRedeem] = useState<Reward | null>(null);
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { data: rewards = [], isLoading } = useRewards();
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;
  const createReward = useCreateReward();
  const redeemReward = useRedeemReward();

  const userXp = profile?.xp || 0;

  // Create reward form
  const [newName, setNewName] = useState("");
  const [newXp, setNewXp] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [isReusable, setIsReusable] = useState(false);

  const emojiOptions = ["🎁", "💆", "🎬", "🍽️", "🍕", "☕", "❤️", "🎮", "🏖️", "🌹", "🍫", "🎵"];

  const catalog = rewards.filter(r => (r.status === 'available' || !r.status) && !r.is_redeemed);
  const history = rewards.filter(r => r.is_redeemed);

  const approveReward = useApproveReward();
  const rejectReward = useRejectReward();
  const completeReward = useCompleteReward();

  const handleRedeem = (reward: Reward) => {
    if (userXp < reward.cost) {
      toast.error("XP insuficiente!", {
        description: `Você precisa de ${reward.cost} XP, mas tem apenas ${userXp} XP.`,
      });
      return;
    }
    setConfirmRedeem(reward);
  };

  const confirmRedemption = () => {
    if (!confirmRedeem) return;

    redeemReward.mutate(confirmRedeem, {
      onSuccess: () => {
        setJustRedeemed(confirmRedeem.id);
        setConfirmRedeem(null);

        // Confetti celebration
        const duration = 1500;
        const end = Date.now() + duration;
        const frame = () => {
          confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ["#FF4D6D", "#8B5CF6", "#F59E0B", "#22C55E", "#4F46E5"],
          });
          confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ["#FF4D6D", "#8B5CF6", "#F59E0B", "#22C55E", "#4F46E5"],
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();

        setTimeout(() => setJustRedeemed(null), 2000);
      }
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !newXp.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    const xpVal = parseInt(newXp);
    if (isNaN(xpVal) || xpVal <= 0) {
      toast.error("XP deve ser um número positivo.");
      return;
    }
    
    createReward.mutate({
      name: newName.trim(),
      cost: xpVal,
      emoji: newEmoji,
      is_reusable: isReusable
    }, {
      onSuccess: () => {
        setNewName("");
        setNewXp("");
        setNewEmoji("🎁");
        setIsReusable(false);
        setShowCreate(false);
      }
    });
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      {/* Header with XP balance */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Recompensas</h1>
          <p className="text-sm font-body text-muted-foreground flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-xp" />
            <span className="font-display font-bold text-xp">{userXp} XP</span> disponível
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground font-display font-bold rounded-xl shadow-[var(--shadow-love)]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Criar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["catalogo", "historico"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {t === "catalogo" ? "Catálogo" : "Histórico"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : tab === "catalogo" ? (
        catalog.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-body text-sm">
            Nenhuma recompensa disponível.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {catalog.map((r) => {
              const canAfford = userXp >= r.cost;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="absolute top-2 right-2 flex gap-1">
                    {r.is_reusable && (
                       <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                          Fixa
                       </span>
                    )}
                  </div>
                  <span className="text-3xl mb-2 mt-2">{r.emoji || "🎁"}</span>
                  <p className="font-display font-bold text-foreground text-sm mb-1">{r.name}</p>
                  <span className="text-xs font-display font-bold text-xp bg-xp/10 rounded-full px-2 py-0.5 mb-3">
                    {r.cost} XP
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(r)}
                    disabled={!canAfford || redeemReward.isPending}
                    className={`w-full font-display font-bold rounded-xl text-xs ${
                      canAfford
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    {canAfford ? "Resgatar" : "XP insuficiente"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {history.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">
              Nenhum resgate ainda.
            </div>
          )}
          {history.map((rd) => {
            const dateStr = rd.redeemed_at ? format(new Date(rd.redeemed_at), "dd 'de' MMM, HH:mm", { locale: ptBR }) : "";
            const redeemerName = rd.created_by === profile?.id ? partnerData?.name : profile?.name; // A bit hacky guess on who redeemed, assuming partner created it
            
            return (
              <motion.div
                key={rd.id}
                layout
                initial={justRedeemed === rd.id ? { opacity: 0, y: -20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rd.emoji || "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground text-sm">{rd.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      {rd.cost} XP · {dateStr}
                    </p>
                  </div>
                  
                  {/* Status Badges & Actions */}
                  {rd.status === 'pending' ? (
                    profile?.id === rd.redeemed_by ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold px-2 py-1 rounded-full bg-xp/10 text-xp animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        Aguardando...
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectReward.mutate(rd)}
                          disabled={rejectReward.isPending}
                          className="h-8 px-2 text-[10px] font-bold text-destructive border-destructive/20 hover:bg-destructive/5 rounded-lg"
                        >
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveReward.mutate(rd)}
                          disabled={approveReward.isPending}
                          className="h-8 px-2 text-[10px] font-bold bg-success text-success-foreground hover:bg-success/90 rounded-lg"
                        >
                          Aprovar
                        </Button>
                      </div>
                    )
                  ) : rd.status === 'approved' ? (
                    profile?.id === rd.redeemed_by ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold px-2 py-1 rounded-full bg-success/10 text-success">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Aprovado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => completeReward.mutate(rd)}
                        disabled={completeReward.isPending}
                        className="h-8 px-2 text-[10px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm"
                      >
                        Marcar como concluído
                      </Button>
                    )
                  ) : rd.status === 'rejected' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold px-2 py-1 rounded-full bg-destructive/10 text-destructive">
                      <X className="w-2.5 h-2.5" />
                      Rejeitado
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-body font-bold px-2 py-1 rounded-full bg-secondary/10 text-secondary`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Concluído
                    </span>
                  )}
                </div>
                {rd.status === 'pending' && profile?.id !== rd.redeemed_by && (
                   <div className="mt-3 pt-3 border-t border-border/50 text-center">
                      <p className="text-[10px] text-muted-foreground font-body">
                         Seu parceiro(a) quer resgatar esta recompensa!
                      </p>
                   </div>
                )}
                {rd.status === 'approved' && profile?.id !== rd.redeemed_by && (
                   <div className="mt-3 pt-3 border-t border-border/50 text-center">
                      <p className="text-[10px] text-primary font-body font-semibold">
                         Aguardando você entregar a recompensa! 🎁
                      </p>
                   </div>
                )}
                {rd.status === 'approved' && profile?.id === rd.redeemed_by && (
                   <div className="mt-3 pt-3 border-t border-border/50 text-center">
                      <p className="text-[10px] text-muted-foreground font-body italic">
                         Aprovado! Aguarde seu parceiro(a) entregar.
                      </p>
                   </div>
                )}
                {rd.status === 'rejected' && (
                   <p className="text-[9px] text-muted-foreground font-body mt-2 italic">
                      O XP foi devolvido para quem solicitou.
                   </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm Redeem Modal */}
      <AnimatePresence>
        {confirmRedeem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center px-6"
            onClick={() => setConfirmRedeem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-xl"
            >
              <span className="text-5xl block">{confirmRedeem.emoji || "🎁"}</span>
              <h2 className="font-display font-bold text-lg text-foreground">Resgatar recompensa?</h2>
              <p className="text-sm text-muted-foreground font-body">
                Você vai gastar <span className="font-bold text-xp">{confirmRedeem.cost} XP</span> para resgatar{" "}
                <span className="font-bold text-foreground">{confirmRedeem.name}</span>.<br/><br/>
                <span className="text-xs italic text-primary font-semibold">Seu parceiro precisará aprovar o resgate.</span>
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmRedeem(null)}
                  className="flex-1 font-display font-bold rounded-xl"
                  disabled={redeemReward.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmRedemption}
                  className="flex-1 bg-primary text-primary-foreground font-display font-bold rounded-xl shadow-[var(--shadow-love)]"
                  disabled={redeemReward.isPending}
                >
                  {redeemReward.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      <Gift className="w-4 h-4 mr-1" /> Confirmar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center px-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Nova Recompensa</h2>
                <button onClick={() => setShowCreate(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Emoji picker */}
              <div>
                <p className="text-xs font-body text-muted-foreground mb-2">Escolha um emoji</p>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((e) => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        newEmoji === e ? "bg-primary/10 ring-2 ring-primary scale-110" : "bg-card border border-border hover:bg-accent"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Nome da recompensa"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  placeholder="Custo em XP (ex: 80)"
                  type="number"
                  value={newXp}
                  onChange={(e) => setNewXp(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-xl">
                 <div className="flex-1">
                    <p className="text-xs font-display font-bold text-foreground">Recompensa Reutilizável</p>
                    <p className="text-[10px] text-muted-foreground font-body">Não some do catálogo após o uso</p>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setIsReusable(!isReusable)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${isReusable ? 'bg-primary' : 'bg-muted'}`}
                 >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isReusable ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
              </div>

              <Button
                className="w-full h-12 bg-primary text-primary-foreground font-display font-bold rounded-xl mt-4 shadow-[var(--shadow-love)]"
                onClick={handleCreate}
                disabled={!newName.trim() || createReward.isPending}
              >
                {createReward.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Recompensa"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rewards;
