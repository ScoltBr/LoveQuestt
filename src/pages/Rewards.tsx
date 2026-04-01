import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, X, CheckCircle2, Sparkles, Loader2, Star, Repeat, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { useRewards, useCreateReward, useRedeemReward, useApproveReward, useRejectReward, useCompleteReward, useUpdateReward, useDeleteReward, Reward } from "@/hooks/useRewards";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Rewards = () => {
  const [tab, setTab] = useState<"catalogo" | "historico">("catalogo");
  const [showCreate, setShowCreate] = useState(false);
  const [confirmRedeem, setConfirmRedeem] = useState<Reward | null>(null);
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null);

  // ── Edit/Delete state ────────────────────────────────────────────────
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editXp, setEditXp] = useState("");
  const [editEmoji, setEditEmoji] = useState("🎁");
  const [editReusable, setEditReusable] = useState(false);

  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { data: rewards = [], isLoading } = useRewards();
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;
  const createReward = useCreateReward();
  const redeemReward = useRedeemReward();
  const approveReward = useApproveReward();
  const rejectReward = useRejectReward();
  const completeReward = useCompleteReward();
  const updateReward = useUpdateReward();
  const deleteReward = useDeleteReward();

  const userXp = profile?.xp || 0;

  const [newName, setNewName] = useState("");
  const [newXp, setNewXp] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [isReusable, setIsReusable] = useState(false);

  const emojiOptions = ["🎁", "💆", "🎬", "🍽️", "🍕", "☕", "❤️", "🎮", "🏖️", "🌹", "🍫", "🎵"];

  const catalog = rewards.filter(r => (r.status === "available" || !r.status) && !r.is_redeemed);
  const history = rewards.filter(r => r.is_redeemed);

  const handleRedeem = (reward: Reward) => {
    if (userXp < reward.cost) {
      toast.error("XP insuficiente!", { description: `Precisa de ${reward.cost} XP, você tem ${userXp}.` });
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
        const end = Date.now() + 1500;
        const frame = () => {
          confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors: ["#FF4D6D", "#8B5CF6", "#F59E0B"] });
          confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors: ["#FF4D6D", "#8B5CF6", "#F59E0B"] });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
        setTimeout(() => setJustRedeemed(null), 2500);
      },
    });
  };

  const handleCreate = () => {
    if (!newName.trim() || !newXp.trim()) { toast.error("Preencha todos os campos."); return; }
    const xpVal = parseInt(newXp);
    if (isNaN(xpVal) || xpVal <= 0) { toast.error("XP deve ser número positivo."); return; }
    createReward.mutate({ name: newName.trim(), cost: xpVal, emoji: newEmoji, is_reusable: isReusable }, {
      onSuccess: () => { setNewName(""); setNewXp(""); setNewEmoji("🎁"); setIsReusable(false); setShowCreate(false); }
    });
  };

  // ── Edit handlers ────────────────────────────────────────────────────
  const openEdit = (reward: Reward) => {
    setEditingReward(reward);
    setEditName(reward.name);
    setEditXp(reward.cost.toString());
    setEditEmoji(reward.emoji || "🎁");
    setEditReusable(reward.is_reusable || false);
    setShowDeleteConfirm(false);
  };

  const handleUpdate = () => {
    if (!editingReward || !editName.trim() || !editXp.trim()) return;
    const xpVal = parseInt(editXp);
    if (isNaN(xpVal) || xpVal <= 0) { toast.error("XP deve ser número positivo."); return; }
    
    updateReward.mutate(
      { id: editingReward.id, updates: { name: editName.trim(), cost: xpVal, emoji: editEmoji, is_reusable: editReusable } },
      { onSuccess: () => setEditingReward(null) }
    );
  };

  const handleDelete = () => {
    if (!editingReward) return;
    deleteReward.mutate(editingReward.id, {
      onSuccess: () => { setEditingReward(null); setShowDeleteConfirm(false); }
    });
  };

  return (
    <div className="px-4 pt-6 pb-28 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-foreground tracking-tight">Recompensas</h1>
          <p className="text-sm font-body text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-xp" />
            <span className="font-black text-xp" style={{ textShadow: "0 0 10px hsl(var(--xp)/0.6)" }}>{userXp} XP</span>
            <span>disponível</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-2xl font-display font-black text-sm shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
        >
          <Plus className="w-4 h-4" /> Criar
        </motion.button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1 glass rounded-2xl">
        {(["catalogo", "historico"] as const).map(t => (
          <motion.button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-display font-black transition-all ${
              tab === t
                ? "bg-primary text-white shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "catalogo" ? "🎁 Catálogo" : "📜 Histórico"}
          </motion.button>
        ))}
      </div>

      {/* CATALOG / HISTORY */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl p-4 space-y-3">
              <div className="w-12 h-12 bg-muted animate-pulse rounded-2xl mx-auto" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded-lg mx-auto" />
              <div className="h-3 w-1/2 bg-muted animate-pulse rounded mx-auto" />
              <div className="h-9 bg-muted animate-pulse rounded-xl" />
            </div>
          ))}
        </div>
      ) : tab === "catalogo" ? (
        catalog.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center text-3xl">🎁</div>
            <p className="text-muted-foreground text-sm">Nenhuma recompensa ainda.</p>
            <button onClick={() => setShowCreate(true)} className="text-primary text-sm font-black underline underline-offset-2">Criar primeira recompensa</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {catalog.map(r => {
              const canAfford = userXp >= r.cost;
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="glass rounded-3xl p-4 flex flex-col items-center text-center relative overflow-hidden"
                >
                  {/* Glow background */}
                  <div className={`absolute inset-0 rounded-3xl transition-opacity ${canAfford ? "opacity-100" : "opacity-0"}`}
                    style={{ background: "radial-gradient(circle at 50% 30%, hsl(var(--primary)/0.06), transparent 70%)" }} />

                  {r.is_reusable && (
                    <div className="absolute top-2.5 right-2.5">
                      <Repeat className="w-3 h-3 text-primary/60" />
                    </div>
                  )}

                  {/* EDIT BUTTON */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                    className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-muted/70 transition-colors z-20"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>

                  <span className="text-4xl mt-2 mb-3 relative z-10">{r.emoji || "🎁"}</span>
                  <p className="font-display font-black text-foreground text-sm mb-2 relative z-10 leading-tight">{r.name}</p>
                  <span
                    className="text-xs font-black text-xp mb-4 relative z-10"
                    style={{ textShadow: "0 0 8px hsl(var(--xp)/0.5)" }}
                  >
                    {r.cost} XP
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleRedeem(r)}
                    disabled={!canAfford || redeemReward.isPending}
                    className={`w-full font-display font-black rounded-2xl text-xs h-9 relative z-10 transition-all ${
                      canAfford
                        ? "bg-primary text-white shadow-[0_0_14px_hsl(var(--primary)/0.4)] hover:scale-[1.03]"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    {canAfford ? "Resgatar" : "Falta XP"}
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-3">
          {history.length === 0 && (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center text-3xl">📜</div>
              <p className="text-muted-foreground text-sm text-center">Nenhum resgate ainda.</p>
            </div>
          )}
          {history.map(rd => {
            const dateStr = rd.redeemed_at ? format(new Date(rd.redeemed_at), "dd 'de' MMM, HH:mm", { locale: ptBR }) : "";
            return (
              <motion.div
                key={rd.id}
                layout
                initial={justRedeemed === rd.id ? { opacity: 0, y: -20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="glass rounded-3xl p-4"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0 mt-0.5">{rd.emoji || "🎁"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-foreground text-sm">{rd.name}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{rd.cost} XP · {dateStr}</p>
                    
                    {/* Status context */}
                    {rd.status === "pending" && profile?.id !== rd.redeemed_by && (
                      <p className="text-[10px] text-primary font-bold mt-1.5">Seu parceiro quer esta recompensa!</p>
                    )}
                    {rd.status === "approved" && profile?.id !== rd.redeemed_by && (
                      <p className="text-[10px] text-success font-bold mt-1.5">Aguardando você entregar! 🎁</p>
                    )}
                    {rd.status === "approved" && profile?.id === rd.redeemed_by && (
                      <p className="text-[10px] text-muted-foreground italic mt-1.5">Aprovado! Aguarde a entrega.</p>
                    )}
                  </div>

                  {/* STATUS BADGE / ACTIONS */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    {rd.status === "pending" ? (
                      profile?.id === rd.redeemed_by ? (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-warning/10 text-warning flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Pendente
                        </span>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => rejectReward.mutate(rd)}
                            disabled={rejectReward.isPending}
                            className="h-8 px-2.5 text-[10px] font-black text-destructive bg-destructive/10 rounded-xl border border-destructive/20 hover:bg-destructive/20 transition-colors"
                          >
                            Rejeitar
                          </button>
                          <button
                            onClick={() => approveReward.mutate(rd)}
                            disabled={approveReward.isPending}
                            className="h-8 px-2.5 text-[10px] font-black text-success-foreground bg-success rounded-xl shadow-[0_0_8px_hsl(var(--success)/0.4)] hover:opacity-90 transition-opacity"
                          >
                            Aprovar
                          </button>
                        </div>
                      )
                    ) : rd.status === "approved" ? (
                      profile?.id === rd.redeemed_by ? (
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Aprovado
                        </span>
                      ) : (
                        <button
                          onClick={() => completeReward.mutate(rd)}
                          disabled={completeReward.isPending}
                          className="h-8 px-3 text-[10px] font-black text-white bg-primary rounded-xl shadow-[0_0_10px_hsl(var(--primary)/0.4)] hover:opacity-90"
                        >
                          Entreguei ✓
                        </button>
                      )
                    ) : rd.status === "rejected" ? (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                        <X className="w-2.5 h-2.5" /> Rejeitado
                      </span>
                    ) : (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-success/10 text-success flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Entregue
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── EDIT REWARD BOTTOM SHEET ───────────────────────────────────── */}
      <AnimatePresence>
        {editingReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => { setEditingReward(null); setShowDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border/50 rounded-t-[28px] p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-xl text-foreground">Editar Recompensa</h2>
                <button
                  onClick={() => { setEditingReward(null); setShowDeleteConfirm(false); }}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* EMOJI GRID */}
              <div>
                <p className="text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">Emoji</p>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map(e => (
                    <button
                      key={e}
                      onClick={() => setEditEmoji(e)}
                      className={`text-2xl w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        editEmoji === e ? "bg-primary/15 ring-2 ring-primary scale-110 shadow-[0_0_10px_hsl(var(--primary)/0.3)]" : "bg-muted/30 hover:bg-muted/60 border border-border/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Nome da recompensa *"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xp" />
                  <input
                    placeholder="Custo em XP"
                    type="number"
                    value={editXp}
                    onChange={e => setEditXp(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-2xl pl-9 pr-4 py-3.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* REUSABLE TOGGLE */}
              <div className="flex items-center justify-between bg-muted/20 border border-border/50 p-4 rounded-2xl">
                <div>
                  <p className="text-sm font-display font-black text-foreground flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-primary" /> Reutilizável
                  </p>
                </div>
                <button
                  onClick={() => setEditReusable(!editReusable)}
                  className={`w-12 h-6 rounded-full transition-all relative ${editReusable ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : "bg-muted"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${editReusable ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              <Button
                className="w-full h-13 py-4 bg-primary text-white font-display font-black rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
                onClick={handleUpdate}
                disabled={!editName.trim() || !editXp.trim() || updateReward.isPending}
              >
                {updateReward.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar Alterações ✏️"}
              </Button>

              {/* Delete */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm font-black text-destructive hover:bg-destructive/5 rounded-2xl transition-colors"
                >
                  Excluir recompensa
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3"
                >
                  <p className="text-xs font-body text-center text-muted-foreground">
                    Tem certeza? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 text-xs font-black text-muted-foreground border border-border/60 rounded-xl hover:bg-muted/20 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleteReward.isPending}
                      className="flex-1 py-2 text-xs font-black text-white bg-destructive rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
                    >
                      {deleteReward.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim, Excluir"}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFIRM REDEEM MODAL */}
      <AnimatePresence>
        {confirmRedeem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setConfirmRedeem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border/50 rounded-[28px] p-7 text-center space-y-5 shadow-2xl"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-[22px] flex items-center justify-center mx-auto border border-primary/20">
                <span className="text-5xl">{confirmRedeem.emoji || "🎁"}</span>
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-foreground mb-2">{confirmRedeem.name}</h2>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Você vai gastar{" "}
                  <span className="font-black text-xp" style={{ textShadow: "0 0 8px hsl(var(--xp)/0.5)" }}>
                    {confirmRedeem.cost} XP
                  </span>{" "}
                  e seu parceiro precisará aprovar o resgate.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmRedeem(null)}
                  className="flex-1 font-display font-black rounded-2xl border-border/60"
                  disabled={redeemReward.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmRedemption}
                  className="flex-1 bg-primary text-white font-display font-black rounded-2xl shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
                  disabled={redeemReward.isPending}
                >
                  {redeemReward.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gift className="w-4 h-4 mr-1" /> Confirmar</>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border/50 rounded-[28px] p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-xl text-foreground">Nova Recompensa</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* EMOJI GRID */}
              <div>
                <p className="text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">Emoji</p>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`text-2xl w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        newEmoji === e ? "bg-primary/15 ring-2 ring-primary scale-110 shadow-[0_0_10px_hsl(var(--primary)/0.3)]" : "bg-muted/30 hover:bg-muted/60 border border-border/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Nome da recompensa *"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xp" />
                  <input
                    placeholder="Custo em XP"
                    type="number"
                    value={newXp}
                    onChange={e => setNewXp(e.target.value)}
                    className="w-full bg-muted/30 border border-border rounded-2xl pl-9 pr-4 py-3.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              {/* REUSABLE TOGGLE */}
              <div className="flex items-center justify-between bg-muted/20 border border-border/50 p-4 rounded-2xl">
                <div>
                  <p className="text-sm font-display font-black text-foreground flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-primary" /> Reutilizável
                  </p>
                  <p className="text-[10px] text-muted-foreground font-body mt-0.5">Não some do catálogo após o uso</p>
                </div>
                <button
                  onClick={() => setIsReusable(!isReusable)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isReusable ? "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]" : "bg-muted"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${isReusable ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>

              <Button
                className="w-full h-13 py-4 bg-primary text-white font-display font-black rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.35)] text-sm uppercase tracking-wide"
                onClick={handleCreate}
                disabled={!newName.trim() || createReward.isPending}
              >
                {createReward.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Recompensa 🎁"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rewards;
