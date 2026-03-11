import { useState, useEffect } from "react";
import { useTheme, ACCENT_COLORS } from "@/hooks/use-theme";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  User, Mail, Lock, Globe, Clock, Camera, LogOut,
  Heart, Link2, Copy, Unlink, Bell, Gift, CheckCircle,
  Target, Flame, Sun, Moon, Monitor, Palette, Crown,
  Star, Shield, Download, Trash2, FileText, ScrollText,
  HelpCircle, MessageSquare, Bug, Send, ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/* ───────── tiny helpers ───────── */
const SectionCard = ({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) => (
  <section className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-[var(--shadow-card)]">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary" />
      <h2 className="font-display font-bold text-foreground">{title}</h2>
    </div>
    {children}
  </section>
);

const SettingRow = ({ icon: Icon, label, children, border = true }: {
  icon: React.ElementType; label: string; children?: React.ReactNode; border?: boolean;
}) => (
  <div className={`flex items-center justify-between py-3 ${border ? "border-b border-border" : ""}`}>
    <span className="flex items-center gap-3 text-sm font-body text-foreground">
      <Icon className="w-4 h-4 text-muted-foreground" /> {label}
    </span>
    {children}
  </div>
);

const ToggleRow = ({ icon: Icon, label, checked, onChange, border = true }: {
  icon: React.ElementType; label: string; checked: boolean; onChange: (v: boolean) => void; border?: boolean;
}) => (
  <SettingRow icon={Icon} label={label} border={border}>
    <Switch checked={checked} onCheckedChange={onChange} />
  </SettingRow>
);

/* ───────── page ───────── */
const Settings = () => {
  const navigate = useNavigate();

  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  /* account */
  const [name, setName] = useState("");
  useEffect(() => { if (profile?.name) setName(profile.name); }, [profile?.name]);
  const [email, setEmail] = useState("");
  useEffect(() => { if (session?.user?.email) setEmail(session.user.email); }, [session?.user?.email]);


  /* notifications */
  const [notifPending, setNotifPending] = useState(true);
  const [notifPartner, setNotifPartner] = useState(true);
  const [notifReward, setNotifReward] = useState(true);
  const [notifGoal, setNotifGoal] = useState(false);
  const [notifStreak, setNotifStreak] = useState(true);

  /* rewards */
  const [rewardApproval, setRewardApproval] = useState(true);
  const [rewardCancel, setRewardCancel] = useState(false);
  const [rewardHistory, setRewardHistory] = useState(true);

  /* appearance */
  const { theme, setTheme, accent, setAccent } = useTheme();
  const themeOptions: { value: typeof theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Escuro", icon: Moon },
    { value: "auto", label: "Automático", icon: Monitor },
  ];

  /* delete modal */
  const [deleteOpen, setDeleteOpen] = useState(false);

  const inviteCode = couple?.invite_code || "N/A";

  const copyInvite = () => {
    navigator.clipboard.writeText(`lovequest.app/invite/${inviteCode}`);
    toast.success("Link copiado!");
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-5 max-w-lg mx-auto">
      {/* header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground font-body mb-3 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-2xl font-extrabold font-display text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Gerencie sua conta, notificações e preferências do LoveQuest.
        </p>
      </div>

      {/* ── 1. Conta ── */}
      <SectionCard icon={User} title="Conta">
        <div className="flex flex-col items-center gap-2 pb-3 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-display font-extrabold text-2xl overflow-hidden">
            {(profile?.name || "U")[0].toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground font-body">Perfil LoveQuest</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-body text-muted-foreground mb-1 block">Nome</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs font-body text-muted-foreground mb-1 block">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <SettingRow icon={Globe} label="Idioma" border>
            <span className="text-sm text-muted-foreground font-body">Português (BR)</span>
          </SettingRow>
          <SettingRow icon={Clock} label="Fuso horário" border={false}>
            <span className="text-sm text-muted-foreground font-body">GMT-3</span>
          </SettingRow>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full rounded-xl font-display font-bold" onClick={async () => {
            if (profile && name !== profile.name) {
              await supabase.from('profiles').update({ name }).eq('id', profile.id);
              toast.success("Perfil atualizado!");
            }
          }}>
            Atualizar perfil
          </Button>
          <Button variant="outline" className="w-full rounded-xl font-display font-bold">
            <Lock className="w-4 h-4 mr-2" /> Alterar senha
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl font-display font-bold text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair da conta
          </Button>
        </div>
      </SectionCard>

      {/* ── 2. Parceiro ── */}
      <SectionCard icon={Heart} title="Parceiro">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-love/10 flex items-center justify-center text-love font-display font-bold text-lg overflow-hidden">
            {(partnerData?.name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-foreground">{partnerData?.name || "Sem parceiro"}</p>
            <p className="text-xs text-muted-foreground font-body">Conectados em {couple?.created_at ? new Date(couple.created_at).toLocaleDateString("pt-BR") : "N/A"}</p>
          </div>
          <Heart className="w-5 h-5 text-love fill-love" />
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 bg-accent rounded-xl px-3 py-2.5 text-xs font-body text-muted-foreground truncate">
              lovequest.app/invite/{inviteCode}
            </div>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={copyInvite}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => toast("Link gerado!")}>
              <Link2 className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            className="w-full rounded-xl font-display font-bold text-destructive border-destructive/20 hover:bg-destructive/5"
            onClick={async () => {
              if (confirm("Tem certeza que deseja desconectar do seu parceiro? Esta ação não excluirá os dados do casal, mas removerá seu acesso a eles até que se conectem novamente.")) {
                try {
                  await supabase.from("profiles").update({ couple_id: null }).eq("id", profile!.id);
                  toast.info("Você foi desconectado(a) do seu parceiro.");
                } catch (error) {
                  toast.error("Erro ao desconectar casal.");
                }
              }
            }}
          >
            <Unlink className="w-4 h-4 mr-2" /> Desconectar casal
          </Button>
        </div>
      </SectionCard>

      {/* ── 3. Notificações ── */}
      <SectionCard icon={Bell} title="Notificações">
        <div>
          <ToggleRow icon={Target} label="Missões pendentes" checked={notifPending} onChange={setNotifPending} />
          <ToggleRow icon={CheckCircle} label="Parceiro completou missão" checked={notifPartner} onChange={setNotifPartner} />
          <ToggleRow icon={Gift} label="Recompensa aprovada" checked={notifReward} onChange={setNotifReward} />
          <ToggleRow icon={Star} label="Meta semanal atingida" checked={notifGoal} onChange={setNotifGoal} />
          <ToggleRow icon={Flame} label="Streak de missões" checked={notifStreak} onChange={setNotifStreak} border={false} />
        </div>
      </SectionCard>

      {/* ── 4. Recompensas ── */}
      <SectionCard icon={Gift} title="Recompensas">
        <p className="text-xs text-muted-foreground font-body -mt-2">
          Recompensas podem exigir aprovação do parceiro antes de serem resgatadas.
        </p>
        <div>
          <ToggleRow icon={CheckCircle} label="Precisam de aprovação" checked={rewardApproval} onChange={setRewardApproval} />
          <ToggleRow icon={Unlink} label="Permitir cancelar recompensas" checked={rewardCancel} onChange={setRewardCancel} />
          <ToggleRow icon={ScrollText} label="Mostrar histórico" checked={rewardHistory} onChange={setRewardHistory} border={false} />
        </div>
      </SectionCard>

      {/* ── 5. Aparência ── */}
      <SectionCard icon={Palette} title="Aparência">
        <div>
          <p className="text-xs text-muted-foreground font-body mb-2">Tema</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all font-body text-xs
                    ${active
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border text-muted-foreground hover:border-primary/40"
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
          <p className="text-xs text-muted-foreground font-body mb-2">Cor de destaque</p>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => setAccent(c.name)}
                className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                  accent === c.name ? "border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background" : "border-border"
                }`}
                style={{ backgroundColor: `hsl(${c.primary})`, ...(accent === c.name ? { ringColor: `hsl(${c.primary})` } : {}) }}
              />
            ))}
          </div>
        </div>
      </SectionCard>

      {/* ── 6. Plano ── */}
      <SectionCard icon={Crown} title="Plano">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Crown className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm">Plano atual: <span className="text-muted-foreground">Free</span></p>
            <p className="text-xs text-muted-foreground font-body">5 missões · 5 recompensas</p>
          </div>
        </div>

        <div className="bg-accent rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-display font-bold text-foreground">✨ Premium inclui:</p>
          <ul className="text-xs text-muted-foreground font-body space-y-1 list-disc list-inside">
            <li>Missões e recompensas ilimitadas</li>
            <li>Estatísticas avançadas</li>
            <li>Temas exclusivos</li>
            <li>Suporte prioritário</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl font-display font-bold text-sm">
            Ver benefícios
          </Button>
          <Button className="flex-1 rounded-xl font-display font-bold text-sm">
            Fazer upgrade
          </Button>
        </div>
      </SectionCard>

      {/* ── 7. Privacidade ── */}
      <SectionCard icon={Shield} title="Privacidade">
        <div>
          <SettingRow icon={Download} label="Exportar meus dados">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={FileText} label="Política de privacidade">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={ScrollText} label="Termos de uso">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Trash2} label="Excluir conta" border={false}>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 text-xs font-display font-bold"
              onClick={() => setDeleteOpen(true)}
            >
              Excluir
            </Button>
          </SettingRow>
        </div>
      </SectionCard>

      {/* ── 8. Suporte ── */}
      <SectionCard icon={HelpCircle} title="Suporte">
        <div>
          <SettingRow icon={HelpCircle} label="Central de ajuda">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={MessageSquare} label="Enviar feedback">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Bug} label="Reportar bug">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Send} label="Contato" border={false}>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </SettingRow>
        </div>
      </SectionCard>

      {/* footer */}
      <p className="text-center text-xs text-muted-foreground font-body pb-2">
        LoveQuest — evoluindo juntos ❤️
      </p>

      {/* Delete account dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Excluir conta</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Tem certeza que deseja excluir sua conta? Todos os dados serão perdidos permanentemente. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1 rounded-xl font-display font-bold">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl font-display font-bold"
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
