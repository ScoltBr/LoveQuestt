import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, User as UserIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHabits, useCompletions, useCompleteHabit, useCreateHabit } from "@/hooks/useHabits";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProfile, useCouple } from "@/hooks/useProfile";

const Missions = () => {
  const [filter, setFilter] = useState<"todas" | "individual" | "casal">("todas");
  const [showCreate, setShowCreate] = useState(false);
  const [showXpPop, setShowXpPop] = useState<string | null>(null);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  const { data: habits = [], isLoading } = useHabits();
  const { data: completions = [] } = useCompletions(todayStr);
  const completeHabit = useCompleteHabit();
  const createHabit = useCreateHabit();

  // Create form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newXp, setNewXp] = useState(20);
  const [newFreq, setNewFreq] = useState<"daily" | "weekly" | "monthly">("daily");
  const [newType, setNewType] = useState<"individual" | "casal">("individual");

  const filteredHabits = habits.filter((h) =>
    filter === "todas" ? true : h.type === filter
  );

  const toggleMission = (habitId: string) => {
    const isCompleted = completions.some(c => c.habit_id === habitId && c.user_id === profile?.id);
    if (isCompleted) return; // Already completed today

    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    setShowXpPop(habitId);
    setTimeout(() => setShowXpPop(null), 800);

    completeHabit.mutate({ habit, date: todayStr });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    createHabit.mutate(
      {
        name: newName,
        category: newDesc,
        xp_value: newXp,
        frequency: newFreq,
        type: newType,
        is_active: true,
        emoji: null,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewName("");
          setNewDesc("");
          setNewXp(20);
        }
      }
    );
  };

  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-foreground">Missões</h1>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-primary text-primary-foreground font-display font-bold rounded-xl shadow-[var(--shadow-love)]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Criar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["todas", "individual", "casal"] as const).map((f) => (
          <motion.button
            key={f}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-body font-medium transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "glass text-muted-foreground"
            }`}
          >
            {f === "todas" ? "Todas" : f === "individual" ? "Individual" : "Casal"}
          </motion.button>
        ))}
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground font-body">
            Nenhuma missão encontrada.
          </div>
        ) : (
          <AnimatePresence>
            {filteredHabits.map((m) => {
              const isCompleted = completions.some(c => c.habit_id === m.id && c.user_id === profile?.id);
              
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  className="relative glass rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleMission(m.id)}
                      disabled={isCompleted || completeHabit.isPending}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-sm mt-0.5 transition-all ${
                        isCompleted
                          ? "bg-success border-success text-success-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {isCompleted && "✓"}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-body font-medium ${
                          isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      >
                        {m.name}
                      </p>
                      {m.category && (
                        <p className="text-xs text-muted-foreground font-body mt-0.5">{m.category}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xp text-xs font-display font-bold bg-xp/10 rounded-full px-2 py-0.5">
                          +{m.xp_value} XP
                        </span>
                        <span className="text-xs text-muted-foreground font-body">
                          {m.frequency === "daily" ? "diária" : m.frequency === "weekly" ? "semanal" : "mensal"}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-body">
                          {m.type === 'casal' ? (
                            <div className="flex -space-x-1.5 mr-1">
                              <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[8px] font-bold">{(profile?.name || "V")[0]}</div>
                              <div className="w-4 h-4 rounded-full bg-love/20 border-2 border-card flex items-center justify-center text-[8px] font-bold">{(partnerData?.name || "?")[0]}</div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-primary/20 mr-1 flex items-center justify-center text-[8px] font-bold">{(profile?.name || "V")[0]}</div>
                          )}
                          {m.type === 'casal' ? "Casal" : "Individual"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {showXpPop === m.id && (
                    <span className="absolute right-4 top-2 text-xp font-display font-bold text-base animate-xp-pop">
                      +{m.xp_value} XP
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Create modal */}
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
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl w-full max-w-md p-6 space-y-4 !bg-opacity-95"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display font-bold text-lg text-foreground">Nova Missão</h2>
                <button onClick={() => setShowCreate(false)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Nome da missão"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <input
                  placeholder="Categoria / Descrição curta"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="XP (ex: 20)"
                    type="number"
                    value={newXp}
                    onChange={e => setNewXp(parseInt(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <select 
                    value={newFreq}
                    onChange={e => setNewFreq(e.target.value as "daily"|"weekly"|"monthly")}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="daily">Diária</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {(["individual", "casal"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-colors border ${
                        newType === t 
                          ? "bg-primary/20 text-primary border-primary/30" 
                          : "bg-background text-muted-foreground border-border hover:bg-accent"
                      }`}
                    >
                      {t === "individual" ? "👤 Individual" : "👫 Casal"}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground font-display font-bold rounded-xl mt-4 h-12 shadow-[var(--shadow-love)]"
                onClick={handleCreate}
                disabled={!newName.trim() || createHabit.isPending}
              >
                {createHabit.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Missão"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Missions;
