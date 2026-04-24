import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, ACCENT_COLORS } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
  User, Lock, Globe, Clock, LogOut, Heart, Link2, Copy,
  Unlink, Bell, Gift, CheckCircle, Target, Flame, Sun, Moon,
  Monitor, Palette, Crown, Star, Shield, Download, Trash2,
  FileText, ScrollText, HelpCircle, MessageSquare, Bug, Send,
  ChevronRight, ChevronDown, Sparkles, Zap, Smartphone, Loader2,
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── COLLAPSIBLE SECTION ─────────────────────────────────────────────────────
const Section = ({
  icon: Icon,
  title,
  subtitle,
  accent = "primary",
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accent?: "primary" | "love" | "xp" | "streak" | "success";
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const accentColor = `hsl(var(--${accent}))`;

  return (
    <motion.div layout className="glass rounded-3xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `hsl(var(--${accent})/0.12)`, border: `1px solid hsl(var(--${accent})/0.2)` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div className="flex-1 text-left">
          <p className="font-display font-black text-sm text-foreground">{title}</p>
          {subtitle && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{subtitle}</p>}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.06]">
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── TOGGLE ROW ──────────────────────────────────────────────────────────────
const ToggleRow = ({ icon: Icon, label, description, checked, onChange, last = false }: {
  icon: React.ElementType; label: string; description?: string;
  checked: boolean; onChange: (v: boolean) => void; last?: boolean;
}) => (
  <div className={`flex items-center gap-3 py-3 ${!last ? "border-b border-white/[0.05]" : ""}`}>
    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-body text-foreground">{label}</p>
      {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

// ─── NAV ROW ─────────────────────────────────────────────────────────────────
const NavRow = ({ icon: Icon, label, onClick, danger = false, last = false }: {
  icon: React.ElementType; label: string; onClick?: () => void; danger?: boolean; last?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 py-3 hover:bg-white/[0.02] transition-colors rounded-xl ${!last ? "border-b border-white/[0.05]" : ""}`}
  >
    <Icon className={`w-4 h-4 shrink-0 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
    <span className={`flex-1 text-left text-sm font-body ${danger ? "text-destructive" : "text-foreground"}`}>{label}</span>
    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
  </button>
);

// ─── Tipo das preferências ────────────────────────────────────────────────────
interface UserPreferences {
  notif_pending:   boolean;
  notif_partner:   boolean;
  notif_reward:    boolean;
  notif_goal:      boolean;
  notif_streak:    boolean;
  reward_approval: boolean;
  reward_cancel:   boolean;
  reward_history:  boolean;
  push_enabled:    boolean;
  push_daily_reminder: boolean;
  push_daily_hour:     number;
}

const PREF_DEFAULTS: UserPreferences = {
  notif_pending:   true,
  notif_partner:   true,
  notif_reward:    true,
  notif_goal:      false,
  notif_streak:    true,
  reward_approval: true,
  reward_cancel:   false,
  reward_history:  true,
  push_enabled:    true,
  push_daily_reminder: true,
  push_daily_hour:     22,
};

// ─── PAGE ────────────────────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;
  const { theme, setTheme, accent, setAccent } = useTheme();

  // ── Push Notifications ─────────────────────────────────────────────────────
  const {
    permission,
    isSubscribed,
    isLoading: pushLoading,
    isSupported: pushSupported,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  const [name, setName] = useState("");
  useEffect(() => { if (profile?.name) setName(profile.name); }, [profile?.name]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const inviteCode = couple?.invite_code || "N/A";

  // ── Buscar preferências persistidas ────────────────────────────────────────
  const { data: savedPrefs } = useQuery<UserPreferences>({
    queryKey: ["preferences", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return PREF_DEFAULTS;
      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      return (data as UserPreferences | null) ?? PREF_DEFAULTS;
    },
    enabled: !!session?.user?.id,
  });

  const [prefs, setPrefs] = useState<UserPreferences>(PREF_DEFAULTS);
  useEffect(() => { if (savedPrefs) setPrefs(savedPrefs); }, [savedPrefs]);

  // ── Salvar preferências no banco ───────────────────────────────────────────
  const savePrefs = useMutation({
    mutationFn: async (newPrefs: UserPreferences) => {
      if (!session?.user?.id) return;
      await supabase
        .from("user_preferences")
        .upsert({ user_id: session.user.id, ...newPrefs }, { onConflict: "user_id" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] });
    },
  });

  const updatePref = <K extends keyof UserPreferences>(key: K, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefs.mutate(updated);
  };

  const themeOptions = [
    { value: "light" as const, label: "Claro",  icon: Sun },
    { value: "dark"  as const, label: "Escuro", icon: Moon },
    { value: "auto"  as const, label: "Auto",   icon: Monitor },
  ];

  // ── Salvar nome ─────────────────────────────────────────────────────────────
  const saveName = async () => {
    const trimmed = name.trim();
    if (!profile || trimmed === profile.name) return;
    if (trimmed.length < 2) { toast.error("Nome muito curto (mínimo 2 caracteres)."); return; }
    if (trimmed.length > 40) { toast.error("Nome muito longo (máximo 40 caracteres)."); return; }
    const { error } = await supabase.from("profiles").update({ name: trimmed }).eq("id", profile.id);
    if (error) toast.error("Erro ao salvar nome.");
    else { toast.success("Nome atualizado!"); queryClient.invalidateQueries({ queryKey: ["profile"] }); }
  };

  // ── Desconectar casal ───────────────────────────────────────────────────────
  const disconnectPartner = async () => {
    try {
      await supabase.from("profiles").update({ couple_id: null }).eq("id", profile!.id);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.info("Desconectado do parceiro.");
    } catch { toast.error("Erro ao desconectar."); }
  };

  // ── Alterar senha ────────────────────────────────────────────────────────────
  const internalPasswordReset = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message || "Erro ao alterar a senha.");
    } else {
      toast.success("Senha atualizada com sucesso!");
    }
    setNewPassword("");
    setChangePasswordOpen(false);
  };

  // ── Enviar feedback ──────────────────────────────────────────────────────────
  const sendFeedback = async () => {
    if (!feedbackText.trim()) return;
    const { error } = await supabase.from("feedback").insert({
      user_id: session?.user?.id,
      content: feedbackText.trim(),
    });
    if (error) toast.error("Erro ao enviar feedback.");
    else { toast.success("Feedback enviado! Obrigado ❤️"); setFeedbackText(""); setFeedbackOpen(false); }
  };

  // ── Exportar Dados ────────────────────────────────────────────────────────
  const exportData = async () => {
    if (!profile) return;
    try {
      toast.info("Agrupando seus dados...");
      
      const { data: userData } = await supabase.from("profiles").select("*").eq("id", profile.id).single();
      const { data: coupleData } = profile.couple_id ? await supabase.from("couples").select("*").eq("id", profile.couple_id).single() : { data: null };
      const { data: achievementsData } = await supabase.from("achievements").select("*").eq("user_id", profile.id);
      
      const payload = {
        exportedAt: new Date().toISOString(),
        user: userData,
        couple: coupleData,
        achievements: achievementsData,
        preferences: prefs
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lovequest-export-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Dados exportados com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar dados.");
    }
  };

  return (
    <div className="px-4 pt-6 pb-10 space-y-3 max-w-lg mx-auto">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-3xl font-display font-black text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Personalize o seu LoveQuest ⚙️</p>
      </div>

      {/* PROFILE CARD */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-primary to-love flex items-center justify-center text-white font-display font-black text-2xl shadow-[0_0_24px_hsl(var(--primary)/0.35)]">
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-black text-foreground text-base truncate">{profile?.name || "Jogador"}</p>
            <p className="text-xs text-muted-foreground font-body truncate">{session?.user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-black text-xp bg-xp/10 px-2 py-0.5 rounded-full" style={{ textShadow: "0 0 8px hsl(var(--xp)/0.5)" }}>
                {profile?.xp || 0} XP
              </span>
              <span className="text-[10px] font-black text-streak bg-streak/10 px-2 py-0.5 rounded-full">
                🔥 {profile?.streak || 0} dias
              </span>
            </div>
          </div>
        </div>

        {/* Name edit */}
        <div className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            maxLength={40}
            className="flex-1 bg-muted/30 border border-border rounded-2xl px-4 py-2.5 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={saveName}
            className="px-4 py-2.5 bg-primary text-white rounded-2xl font-display font-black text-sm shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:opacity-90 transition-opacity"
          >
            Salvar
          </button>
        </div>

        {/* Auth actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setChangePasswordOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-border/60 text-xs font-black text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all"
          >
            <Lock className="w-3 h-3" /> Alterar senha
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-destructive/20 text-xs font-black text-destructive hover:bg-destructive/5 transition-all"
          >
            <LogOut className="w-3 h-3" /> Sair
          </button>
        </div>
      </div>

      {/* ADMIN PANEL ENTRY */}
      <button
        onClick={() => navigate("/app/admin")}
        className="w-full relative overflow-hidden group rounded-3xl p-5 mb-4 border border-rose-500/30"
        style={{ background: "linear-gradient(135deg, hsl(var(--destructive)/0.15), hsl(var(--primary)/0.05))" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-left">
              <p className="font-display font-black text-rose-500 text-lg">Central de Comando</p>
              <p className="text-xs text-rose-500/70 font-body">Gerenciar missões, loja e XP do parceiro</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-rose-500/50 group-hover:text-rose-500 transition-colors" />
        </div>
      </button>

      {/* ── SEÇÕES COLAPSÁVEIS ────────────────────────────────────────────────── */}

      {/* PARCEIRO */}
      <Section icon={Heart} title="Parceiro(a)" subtitle={partnerData?.name || "Sem parceiro"} accent="love" defaultOpen={!!partnerData}>
        {partnerData ? (
          <>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-love/5 border border-love/10 mb-3">
              <div className="w-10 h-10 rounded-xl bg-love/10 border border-love/20 flex items-center justify-center text-love font-display font-black">
                {partnerData.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-display font-black text-sm text-foreground">{partnerData.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Conectados desde{" "}
                  {couple?.created_at ? new Date(couple.created_at).toLocaleDateString("pt-BR") : "N/A"}
                </p>
              </div>
              <Heart className="w-5 h-5 text-love fill-love ml-auto" />
            </div>

            <div className="flex gap-2 mb-2">
              <div className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-[11px] font-body text-muted-foreground truncate">
                lovequest.app/invite/{inviteCode}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(`lovequest.app/invite/${inviteCode}`); toast.success("Link copiado!"); }}
                className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted/40 transition-colors"
              >
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                className="w-9 h-9 rounded-xl border border-border/60 flex items-center justify-center hover:bg-muted/40 transition-colors"
                onClick={() => { navigator.share?.({ title: "LoveQuest", text: `Use o código ${inviteCode} para se conectar comigo!` }).catch(() => {}); }}
              >
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={() => setDisconnectOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-destructive/20 text-xs font-black text-destructive hover:bg-destructive/5 transition-all"
            >
              <Unlink className="w-3.5 h-3.5" /> Desconectar casal
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum parceiro conectado ainda.</p>
        )}
      </Section>

      {/* PUSH NOTIFICATIONS */}
      <Section icon={Smartphone} title="Notificações Push" subtitle={isSubscribed ? "Ativas neste dispositivo" : "Não ativadas"} accent="primary" defaultOpen={false}>
        {!pushSupported ? (
          <div className="rounded-2xl bg-muted/20 border border-border/50 p-4 text-center">
            <p className="text-sm text-muted-foreground font-body">
              Seu navegador não suporta notificações push.<br />
              <span className="text-xs opacity-70">No iOS, adicione o site à tela inicial primeiro.</span>
            </p>
          </div>
        ) : (
          <>
            {/* Status Badge */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border mb-4 ${
              isSubscribed
                ? "bg-success/5 border-success/20"
                : "bg-muted/20 border-border/50"
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isSubscribed ? "bg-success shadow-[0_0_6px_hsl(var(--success)/0.6)]" : "bg-muted-foreground/40"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-black text-foreground">
                  {isSubscribed ? "Notificações ativas" : "Notificações inativas"}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {permission === "denied"
                    ? "Bloqueadas pelo navegador — reative nas configurações do sistema"
                    : isSubscribed
                    ? "Este dispositivo receberá alertas do LoveQuest"
                    : "Ative para receber lembretes e alertas de recompensa"}
                </p>
              </div>
            </div>

            {/* Toggle Principal */}
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={pushLoading || permission === "denied"}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-black text-sm transition-all mb-3 ${
                pushLoading || permission === "denied"
                  ? "bg-muted/40 text-muted-foreground cursor-not-allowed"
                  : isSubscribed
                  ? "border border-border/60 text-muted-foreground hover:bg-muted/20"
                  : "bg-primary text-white shadow-[0_0_16px_hsl(var(--primary)/0.4)] hover:opacity-90"
              }`}
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
              {pushLoading
                ? "Aguarde..."
                : isSubscribed
                ? "Desativar notificações"
                : "Ativar notificações 🔔"}
            </button>

            {/* Botão de teste (só quando subscrito) */}
            {isSubscribed && (
              <>
                <button
                  onClick={sendTestNotification}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border/40 text-xs font-black text-muted-foreground hover:bg-muted/20 transition-colors mb-4"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Enviar notificação de teste
                </button>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">Preferências de Push</p>
                  <ToggleRow 
                    icon={Clock} 
                    label="Lembrete diário" 
                    description="Te avisa para preencher as atividades" 
                    checked={prefs.push_daily_reminder} 
                    onChange={(v) => updatePref("push_daily_reminder", v)} 
                  />
                  <div className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-body text-foreground">Horário do lembrete</span>
                    </div>
                    <select 
                      value={prefs.push_daily_hour}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const updated = { ...prefs, push_daily_hour: val };
                        setPrefs(updated);
                        savePrefs.mutate(updated);
                      }}
                      className="bg-transparent border-none text-sm font-black text-primary focus:ring-0 cursor-pointer"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <option key={i} value={i} className="bg-background">{i.toString().padStart(2, '0')}:00</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Info iOS */}
            <p className="text-[10px] text-muted-foreground/60 text-center font-body mt-3 leading-relaxed">
              📱 No iPhone, adicione o LoveQuest à tela inicial via Safari
              para receber notificações push.
            </p>
          </>
        )}
      </Section>

      {/* NOTIFICAÇÕES IN-APP */}
      <Section icon={Bell} title="Notificações In-App" subtitle="Quando te avisamos" accent="primary">
        <ToggleRow icon={Target}      label="Missões pendentes"          checked={prefs.notif_pending} onChange={(v) => updatePref("notif_pending", v)} />
        <ToggleRow icon={CheckCircle} label="Parceiro completou missão"  checked={prefs.notif_partner} onChange={(v) => updatePref("notif_partner", v)} />
        <ToggleRow icon={Gift}        label="Recompensa aprovada"        checked={prefs.notif_reward}  onChange={(v) => updatePref("notif_reward", v)} />
        <ToggleRow icon={Star}        label="Meta semanal atingida"      checked={prefs.notif_goal}    onChange={(v) => updatePref("notif_goal", v)} />
        <ToggleRow icon={Flame}       label="Alerta de streak"           checked={prefs.notif_streak}  onChange={(v) => updatePref("notif_streak", v)} last />
      </Section>

      {/* RECOMPENSAS */}
      <Section icon={Gift} title="Recompensas" subtitle="Regras de resgate" accent="xp">
        <ToggleRow icon={CheckCircle} label="Exigir aprovação do parceiro" description="O parceiro confirma antes de resgatar" checked={prefs.reward_approval} onChange={(v) => updatePref("reward_approval", v)} />
        <ToggleRow icon={Unlink}      label="Permitir cancelar resgates"                                                       checked={prefs.reward_cancel}   onChange={(v) => updatePref("reward_cancel", v)} />
        <ToggleRow icon={ScrollText}  label="Mostrar histórico de resgates"                                                    checked={prefs.reward_history}  onChange={(v) => updatePref("reward_history", v)} last />
      </Section>

      {/* APARÊNCIA */}
      <Section icon={Palette} title="Aparência" subtitle={`Tema: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Auto"}`} accent="primary">
        <div className="mb-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-2 py-3 rounded-2xl border-2 text-xs font-black transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "border-border text-muted-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Cor de destaque</p>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => setAccent(c.name)}
                className="w-9 h-9 rounded-full border-[3px] transition-all hover:scale-110"
                style={{
                  backgroundColor: `hsl(${c.primary})`,
                  borderColor: accent === c.name ? `hsl(${c.primary})` : "transparent",
                  boxShadow: accent === c.name ? `0 0 14px hsl(${c.primary} / 0.5)` : "none",
                  outline: accent === c.name ? `2px solid hsl(var(--background))` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* PLANO */}
      <Section icon={Crown} title="Plano Premium" subtitle="Desbloqueie tudo" accent="xp">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Crown className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-display font-black text-sm text-foreground">Plano Free</p>
            <p className="text-[11px] text-muted-foreground">5 missões · 5 recompensas</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--love)/0.08))", border: "1px solid hsl(var(--primary)/0.2)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <Sparkles className="w-4 h-4 text-xp" style={{ filter: "drop-shadow(0 0 5px hsl(var(--xp)))" }} />
            <span className="font-display font-black text-sm text-foreground">Premium inclui:</span>
          </div>
          <ul className="space-y-1.5 relative z-10">
            {["Missões e recompensas ilimitadas", "Estatísticas avançadas", "Temas exclusivos", "Suporte prioritário"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                <Zap className="w-3 h-3 text-primary shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-2xl border border-border/60 text-xs font-black text-muted-foreground hover:text-foreground hover:border-border transition-all">
            Ver benefícios
          </button>
          <button className="flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-black shadow-[0_0_16px_hsl(var(--primary)/0.35)] hover:opacity-90 transition-opacity">
            ✨ Fazer upgrade
          </button>
        </div>
      </Section>

      {/* PRIVACIDADE */}
      <Section icon={Shield} title="Privacidade & Dados" subtitle="Seus dados são seus" accent="success">
        <NavRow icon={Download}   label="Exportar meus dados"      onClick={exportData} />
        <NavRow icon={FileText}   label="Política de privacidade"  onClick={() => window.open("https://lovequest.app/privacidade", "_blank")} />
        <NavRow icon={ScrollText} label="Termos de uso"            onClick={() => window.open("https://lovequest.app/termos", "_blank")} />
        <NavRow icon={Trash2}     label="Excluir conta"            onClick={() => setDeleteOpen(true)} danger last />
      </Section>

      {/* SUPORTE */}
      <Section icon={HelpCircle} title="Suporte" subtitle="Estamos aqui para ajudar" accent="primary">
        <NavRow icon={HelpCircle}    label="Central de ajuda"     onClick={() => window.open("https://lovequest.app/ajuda", "_blank")} />
        <NavRow icon={MessageSquare} label="Enviar feedback"      onClick={() => setFeedbackOpen(true)} />
        <NavRow icon={Bug}           label="Reportar bug"         onClick={() => { setFeedbackText("🐛 Bug: "); setFeedbackOpen(true); }} />
        <NavRow icon={Send}          label="Falar com a equipe"   onClick={() => window.open("mailto:oi@lovequest.app")} last />
      </Section>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-1 pt-2 pb-4">
        <p className="text-xs text-muted-foreground font-body">LoveQuest — evoluindo juntos ❤️</p>
        <p className="text-[10px] text-muted-foreground/50 font-body">v1.1.0</p>
      </div>

      {/* ── DIALOGS ──────────────────────────────────────────────────────────── */}

      {/* Alterar senha */}
      <AlertDialog open={changePasswordOpen} onOpenChange={(val) => { setChangePasswordOpen(val); if (!val) setNewPassword(""); }}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-border/50 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black">Alterar Senha Internamente</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm text-muted-foreground">
              Digite a sua nova senha abaixo. Ela deve conter pelo menos 6 caracteres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nova senha"
            className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="rounded-2xl font-display font-black">Cancelar</AlertDialogCancel>
            <Button
              onClick={internalPasswordReset}
              disabled={newPassword.length < 6}
              className="rounded-2xl bg-primary font-display font-black"
            >
              Salvar Senha
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Desconectar casal */}
      <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <AlertDialogContent className="rounded-3xl max-w-sm border-border/50 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-black text-destructive">Desconectar casal?</AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm text-muted-foreground">
              Os dados do casal serão mantidos, mas vocês deixarão de compartilhar missões e recompensas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-display font-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { disconnectPartner(); setDisconnectOpen(false); }}
              className="rounded-2xl bg-destructive font-display font-black"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="rounded-3xl max-w-sm border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display font-black">Enviar Feedback</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Sua opinião nos ajuda a melhorar o LoveQuest ❤️
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Descreva sua sugestão, bug ou elogio..."
            rows={4}
            className="w-full bg-muted/30 border border-border rounded-2xl px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 rounded-2xl font-display font-black">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={sendFeedback}
              disabled={!feedbackText.trim()}
              className="flex-1 rounded-2xl bg-primary font-display font-black"
            >
              Enviar ❤️
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ACCOUNT DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl max-w-sm mx-auto border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="font-display font-black text-destructive">Excluir conta</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              Todos os dados serão perdidos permanentemente. Esta ação <strong>não pode</strong> ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 rounded-2xl font-display font-black">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="flex-1 rounded-2xl font-display font-black"
              onClick={async () => {
                // Em produção: chamar Edge Function para deletar usuário
                toast.error("Funcionalidade em desenvolvimento. Entre em contato com o suporte.");
                setDeleteOpen(false);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
