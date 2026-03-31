import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme, ACCENT_COLORS } from "@/hooks/use-theme";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  User, Lock, Globe, Clock, LogOut, Heart, Link2, Copy,
  Unlink, Bell, Gift, CheckCircle, Target, Flame, Sun, Moon,
  Monitor, Palette, Crown, Star, Shield, Download, Trash2,
  FileText, ScrollText, HelpCircle, MessageSquare, Bug, Send,
  ChevronRight, ChevronDown, Sparkles, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
        onClick={() => setOpen(v => !v)}
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

// ─── PAGE ────────────────────────────────────────────────────────────────────
const Settings = () => {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;
  const { theme, setTheme, accent, setAccent } = useTheme();

  const [name, setName] = useState("");
  useEffect(() => { if (profile?.name) setName(profile.name); }, [profile?.name]);

  const [notifPending, setNotifPending]   = useState(true);
  const [notifPartner, setNotifPartner]   = useState(true);
  const [notifReward,  setNotifReward]    = useState(true);
  const [notifGoal,    setNotifGoal]      = useState(false);
  const [notifStreak,  setNotifStreak]    = useState(true);
  const [rewardApproval, setRewardApproval] = useState(true);
  const [rewardCancel,   setRewardCancel]   = useState(false);
  const [rewardHistory,  setRewardHistory]  = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const inviteCode = couple?.invite_code || "N/A";

  const themeOptions = [
    { value: "light" as const,  label: "Claro",     icon: Sun },
    { value: "dark"  as const,  label: "Escuro",    icon: Moon },
    { value: "auto"  as const,  label: "Auto",      icon: Monitor },
  ];

  const saveName = async () => {
    if (!profile || name === profile.name) return;
    await supabase.from("profiles").update({ name }).eq("id", profile.id);
    toast.success("Nome atualizado!");
  };

  const disconnectPartner = async () => {
    if (!confirm("Desconectar do seu parceiro? Os dados do casal serão mantidos.")) return;
    try {
      await supabase.from("profiles").update({ couple_id: null }).eq("id", profile!.id);
      toast.info("Desconectado do parceiro.");
    } catch { toast.error("Erro ao desconectar."); }
  };

  return (
    <div className="px-4 pt-6 pb-10 space-y-3 max-w-lg mx-auto">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-3xl font-display font-black text-foreground tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Personalize o seu LoveQuest ⚙️</p>
      </div>

      {/* PROFILE CARD (always visible, not collapsible) */}
      <div className="glass rounded-3xl p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
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
            onChange={e => setName(e.target.value)}
            placeholder="Seu nome"
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
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-border/60 text-xs font-black text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all">
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

      {/* ── SEÇÕES COLAPSÁVEIS ───────────────────────────────────────────────── */}

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
                onClick={() => toast("Link de convite gerado!")}
              >
                <Link2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <button
              onClick={disconnectPartner}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-destructive/20 text-xs font-black text-destructive hover:bg-destructive/5 transition-all"
            >
              <Unlink className="w-3.5 h-3.5" /> Desconectar casal
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum parceiro conectado ainda.</p>
        )}
      </Section>

      {/* NOTIFICAÇÕES */}
      <Section icon={Bell} title="Notificações" subtitle="Quando te avisamos" accent="primary">
        <ToggleRow icon={Target}      label="Missões pendentes"           checked={notifPending} onChange={setNotifPending} />
        <ToggleRow icon={CheckCircle} label="Parceiro completou missão"   checked={notifPartner} onChange={setNotifPartner} />
        <ToggleRow icon={Gift}        label="Recompensa aprovada"         checked={notifReward}  onChange={setNotifReward} />
        <ToggleRow icon={Star}        label="Meta semanal atingida"       checked={notifGoal}    onChange={setNotifGoal} />
        <ToggleRow icon={Flame}       label="Alerta de streak"            checked={notifStreak}  onChange={setNotifStreak} last />
      </Section>

      {/* RECOMPENSAS */}
      <Section icon={Gift} title="Recompensas" subtitle="Regras de resgate" accent="xp">
        <ToggleRow icon={CheckCircle} label="Exigir aprovação do parceiro" description="O parceiro confirma antes de resgatar" checked={rewardApproval} onChange={setRewardApproval} />
        <ToggleRow icon={Unlink}      label="Permitir cancelar resgates"                                checked={rewardCancel}   onChange={setRewardCancel} />
        <ToggleRow icon={ScrollText}  label="Mostrar histórico de resgates"                              checked={rewardHistory}  onChange={setRewardHistory} last />
      </Section>

      {/* APARÊNCIA */}
      <Section icon={Palette} title="Aparência" subtitle={`Tema: ${theme === "light" ? "Claro" : theme === "dark" ? "Escuro" : "Auto"}`} accent="primary">
        {/* Theme picker */}
        <div className="mb-4">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(t => {
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

        {/* Accent color */}
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Cor de destaque</p>
          <div className="flex gap-3 flex-wrap">
            {ACCENT_COLORS.map(c => (
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
        {/* Current plan badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Crown className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-display font-black text-sm text-foreground">Plano Free</p>
            <p className="text-[11px] text-muted-foreground">5 missões · 5 recompensas</p>
          </div>
        </div>

        {/* Premium card */}
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
            {["Missões e recompensas ilimitadas", "Estatísticas avançadas", "Temas exclusivos", "Suporte prioritário"].map(f => (
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
        <NavRow icon={Download}   label="Exportar meus dados" />
        <NavRow icon={FileText}   label="Política de privacidade" />
        <NavRow icon={ScrollText} label="Termos de uso" />
        <NavRow icon={Trash2}     label="Excluir conta" onClick={() => setDeleteOpen(true)} danger last />
      </Section>

      {/* SUPORTE */}
      <Section icon={HelpCircle} title="Suporte" subtitle="Estamos aqui para ajudar" accent="primary">
        <NavRow icon={HelpCircle}    label="Central de ajuda" />
        <NavRow icon={MessageSquare} label="Enviar feedback" />
        <NavRow icon={Bug}           label="Reportar bug" />
        <NavRow icon={Send}          label="Falar com a equipe" last />
      </Section>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-1 pt-2 pb-4">
        <p className="text-xs text-muted-foreground font-body">LoveQuest — evoluindo juntos ❤️</p>
        <p className="text-[10px] text-muted-foreground/50 font-body">v1.0.0</p>
      </div>

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
              onClick={() => { setDeleteOpen(false); toast.error("Conta excluída."); }}
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
