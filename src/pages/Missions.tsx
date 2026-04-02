import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Loader2, Lock, Users, User, Zap, Calendar, Pencil, Archive, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits, useCompletions, useCompleteHabit, useUncompleteHabit, useCreateHabit, useUpdateHabit, useDeleteHabit, Habit } from "@/hooks/useHabits";
import { format } from "date-fns";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { missionTemplates, MissionTemplate } from "@/data/missionTemplates";

const typeConfig = {
  individual: { label: "Individual", icon: User, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", glow: "hsl(var(--primary)/0.5)" },
  casal:      { label: "Casal",      icon: Users, color: "text-love",    bg: "bg-love/10",    border: "border-love/20",    glow: "hsl(var(--love)/0.5)" },
  privada:    { label: "Privada",    icon: Lock,  color: "text-muted-foreground", bg: "bg-muted/20", border: "border-border", glow: "transparent" },
} as const;

const freqLabel = { daily: "Diária", weekly: "Semanal", monthly: "Mensal" } as const;

const Missions = () => {
  const [filter, setFilter] = useState<"todas" | "individual" | "casal" | "privada">("todas");
  const [showCreate, setShowCreate] = useState(false);
  const [showXpPop, setShowXpPop] = useState<string | null>(null);
  const [popType, setPopType] = useState<"plus" | "minus">("plus");

  // ── Edit/Delete state ────────────────────────────────────────────────
  const [editingMission, setEditingMission] = useState<Habit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editXp, setEditXp] = useState(20);
  const [editFreq, setEditFreq] = useState<"daily" | "weekly" | "monthly">("daily");

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const { data: habits = [], isLoading } = useHabits();
  const { data: completions = [] } = useCompletions(todayStr);
  const completeHabit = useCompleteHabit();
  const uncompleteHabit = useUncompleteHabit();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newXp, setNewXp] = useState(20);
  const [newFreq, setNewFreq] = useState<"daily" | "weekly" | "monthly">("daily");
  const [newType, setNewType] = useState<"individual" | "casal" | "privada">("individual");

  const handleTemplateClick = (t: MissionTemplate) => {
    setNewName(t.name);
    setNewDesc(t.category);
    setNewXp(t.xp_value);
    setNewFreq(t.frequency);
    setNewType(t.type);
    setShowCreate(true);
  };

  const filteredHabits = habits.filter(h => filter === "todas" ? true : h.type === filter);

  const toggleMission = (habitId: string) => {
    const isCompleted = completions.some(c => c.habit_id === habitId && c.user_id === profile?.id);
    
    if (isCompleted) {
      setPopType("minus");
      setShowXpPop(habitId);
      setTimeout(() => setShowXpPop(null), 900);
      uncompleteHabit.mutate({ habitId, date: todayStr });
      return;
    }

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    setPopType("plus");
    setShowXpPop(habitId);
    setTimeout(() => setShowXpPop(null), 900);
    completeHabit.mutate({ habit, date: todayStr });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createHabit.mutate({ name: newName, category: newDesc, xp_value: newXp, frequency: newFreq, type: newType, is_active: true, emoji: null }, {
      onSuccess: () => { setShowCreate(false); setNewName(""); setNewDesc(""); setNewXp(20); }
    });
  };

  // ── Edit handlers ────────────────────────────────────────────────────
  const openEdit = (mission: Habit) => {
    setEditingMission(mission);
    setEditName(mission.name);
    setEditDesc(mission.category || "");
    setEditXp(mission.xp_value);
    setEditFreq(mission.frequency);
    setShowDeleteConfirm(false);
  };

  const handleUpdate = () => {
    if (!editingMission || !editName.trim()) return;
    updateHabit.mutate(
      { id: editingMission.id, updates: { name: editName, category: editDesc, xp_value: editXp, frequency: editFreq } },
      { onSuccess: () => setEditingMission(null) }
    );
  };

  const handleDelete = () => {
    if (!editingMission) return;
    deleteHabit.mutate(editingMission.id, {
      onSuccess: () => { setEditingMission(null); setShowDeleteConfirm(false); }
    });
  };

  const completedToday = completions.filter(c => c.user_id === profile?.id).length;
  const totalActive = habits.length;

  return (
    <div className="px-4 pt-6 pb-28 space-y-5">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-black text-foreground tracking-tight">Missões</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-body">
            <span className="font-black text-foreground">{completedToday}</span>/{totalActive} concluídas hoje
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl font-display font-black text-sm shadow-[0_0_16px_hsl(var(--primary)/0.4)]"
        >
          <Plus className="w-4 h-4" /> Criar
        </motion.button>
      </div>

      {/* FILTER PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {(["todas", "individual", "casal", "privada"] as const).map(f => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.93 }}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-display font-black transition-all ${
              filter === f
                ? "bg-primary text-white shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                : "glass text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "todas" ? "✦ Todas" : f === "individual" ? "👤 Individual" : f === "casal" ? "👫 Casal" : "🔒 Privada"}
          </motion.button>
        ))}
      </div>

      {/* QUICK SUGGESTIONS */}
      <div className="space-y-2">
        <h2 className="text-sm font-display font-black text-foreground px-1">Sugestões Rápidas ✨</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-3 px-1 pb-2">
            {missionTemplates.map(template => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleTemplateClick(template)}
                className="glass rounded-2xl p-4 flex flex-col items-start gap-1.5 min-w-[150px] text-left hover:border-primary/40 transition-colors"
              >
                <span className="text-2xl">{template.icon}</span>
                <p className="font-display font-black text-sm text-foreground truncate w-full leading-tight">{template.name}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-xp" style={{ textShadow: "0 0 8px hsl(var(--xp)/0.6)" }}>+{template.xp_value} XP</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{template.type === "casal" ? "Casal" : "Indiv."}</span>
                </div>
              </motion.button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      {/* MISSION LIST */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded-lg" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))
        ) : filteredHabits.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center text-3xl">🎯</div>
            <p className="text-muted-foreground text-sm font-body">Nenhuma missão aqui.</p>
            <button onClick={() => setShowCreate(true)} className="text-primary text-sm font-black underline underline-offset-2">Criar primeira missão</button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredHabits.map((m, idx) => {
              const isCompleted = completions.some(c => c.habit_id === m.id && c.user_id === profile?.id);
              const cfg = typeConfig[m.type];
              const TypeIcon = cfg.icon;

              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ delay: idx * 0.04 }}
                  whileHover={{ y: -2 }}
                  className={`relative glass rounded-3xl p-4 border transition-all ${isCompleted ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    {/* CHECK BUTTON */}
                    <motion.button
                      whileTap={{ scale: 0.65 }}
                      transition={{ type: "spring", stiffness: 600, damping: 18 }}
                      onClick={() => toggleMission(m.id)}
                      disabled={completeHabit.isPending || uncompleteHabit.isPending}
                      className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center shrink-0 text-lg transition-all ${
                        isCompleted
                          ? "bg-success border-success shadow-[0_0_12px_hsl(var(--success)/0.5)]"
                          : `${cfg.bg} ${cfg.border} hover:border-primary/60`
                      }`}
                    >
                      {isCompleted ? (
                        <span className="text-success-foreground font-black text-sm">✓</span>
                      ) : (
                        <TypeIcon className={`w-5 h-5 ${cfg.color}`} />
                      )}
                    </motion.button>

                    {/* CONTENT — clicável para abrir edição */}
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => openEdit(m)}
                    >
                      <p className={`font-display font-black text-sm leading-snug ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {m.name}
                      </p>
                      {m.category && (
                        <p className="text-[11px] text-muted-foreground font-body mt-0.5">{m.category}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black ${cfg.color} ${cfg.bg} px-2 py-0.5 rounded-full`}>
                          {cfg.label}
                        </span>
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Calendar className="w-2.5 h-2.5" />
                          {freqLabel[m.frequency]}
                        </span>
                      </div>
                    </button>

                    {/* XP BADGE + EDIT ICON */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className="text-xs font-black text-xp"
                        style={{ textShadow: m.type !== "privada" ? "0 0 8px hsl(var(--xp)/0.6)" : "none" }}
                      >
                        {m.type === "privada" ? "🔒" : `+${m.xp_value} XP`}
                      </span>
                      <button
                        onClick={() => openEdit(m)}
                        className="w-6 h-6 rounded-lg bg-muted/40 flex items-center justify-center hover:bg-muted/70 transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* XP POP */}
                  <AnimatePresence>
                    {showXpPop === m.id && (
                      <motion.span
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={{ opacity: 0, y: popType === "plus" ? -28 : 28, scale: 1.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className={`absolute right-4 top-3 font-display font-black text-sm pointer-events-none ${
                          popType === "plus" ? "text-xp" : "text-destructive"
                        }`}
                        style={{ textShadow: popType === "plus" ? "0 0 12px hsl(var(--xp))" : "0 0 12px hsl(var(--destructive))" }}
                      >
                        {m.type === "privada" ? "🔒" : `${popType === "plus" ? "+" : "-"}${m.xp_value} XP`}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── EDIT MISSION BOTTOM SHEET ──────────────────────────────────── */}
      <AnimatePresence>
        {editingMission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => { setEditingMission(null); setShowDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border/50 rounded-t-[28px] p-6 space-y-4 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="font-display font-black text-lg text-foreground">Editar Missão</h2>
                <button
                  onClick={() => { setEditingMission(null); setShowDeleteConfirm(false); }}
                  className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <input
                  placeholder="Nome da missão *"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  placeholder="Categoria / Descrição"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xp" />
                    <input
                      type="number"
                      value={editXp}
                      onChange={e => setEditXp(parseInt(e.target.value) || 0)}
                      className="w-full bg-muted/30 border border-border rounded-2xl pl-9 pr-4 py-3 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <select
                    value={editFreq}
                    onChange={e => setEditFreq(e.target.value as "daily" | "weekly" | "monthly")}
                    className="bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>

              {/* Save button */}
              <Button
                className="w-full py-3 bg-primary text-white font-display font-black rounded-2xl shadow-[0_0_16px_hsl(var(--primary)/0.35)]"
                onClick={handleUpdate}
                disabled={!editName.trim() || updateHabit.isPending}
              >
                {updateHabit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações ✏️"}
              </Button>
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-4"
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
                <h2 className="font-display font-black text-xl text-foreground">Nova Missão</h2>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  placeholder="Nome da missão *"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <input
                  placeholder="Categoria / Descrição"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xp" />
                    <input
                      placeholder="XP"
                      type="number"
                      value={newXp}
                      onChange={e => setNewXp(parseInt(e.target.value) || 0)}
                      className="w-full bg-muted/30 border border-border rounded-2xl pl-9 pr-4 py-3.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                  <select
                    value={newFreq}
                    onChange={e => setNewFreq(e.target.value as "daily" | "weekly" | "monthly")}
                    className="bg-muted/30 border border-border rounded-2xl px-4 py-3.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>

                {/* TYPE SELECTOR */}
                <div className="grid grid-cols-3 gap-2">
                  {(["individual", "casal", "privada"] as const).map(t => {
                    const c = typeConfig[t];
                    const TIcon = c.icon;
                    return (
                      <button
                        key={t}
                        onClick={() => setNewType(t)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-black border-2 transition-all ${
                          newType === t ? `${c.bg} ${c.border} ${c.color}` : "bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40"
                        }`}
                      >
                        <TIcon className="w-4 h-4" />
                        {t === "individual" ? "Individual" : t === "casal" ? "Casal" : "Privada"}
                      </button>
                    );
                  })}
                </div>

                {newType === "privada" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-[11px] text-muted-foreground text-center bg-muted/30 rounded-xl p-3"
                  >
                    🔒 Invisível ao parceiro · sem XP
                  </motion.p>
                )}
              </div>

              <Button
                className="w-full h-13 bg-primary text-white font-display font-black rounded-2xl shadow-[0_0_20px_hsl(var(--primary)/0.35)] text-sm uppercase tracking-wide py-4"
                onClick={handleCreate}
                disabled={!newName.trim() || createHabit.isPending}
              >
                {createHabit.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Missão 🎯"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Missions;
