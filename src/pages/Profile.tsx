import { achievements } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { useCoupleStats } from "@/hooks/useCoupleStats";
import { supabase } from "@/lib/supabase";
import { Heart, LogOut, Crown, Settings, Copy, Share2, Flame, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { level: relationshipLevel } = useCoupleStats();
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  return (
    <div className="px-4 pt-6 space-y-4 pb-4">
      <h1 className="text-2xl font-extrabold text-foreground">Perfil</h1>

      {/* User card */}
      <div className="bg-card border border-border rounded-2xl p-5 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary font-display font-extrabold text-2xl overflow-hidden">
          {(profile?.name || "U")[0].toUpperCase()}
        </div>
        <h2 className="font-display font-bold text-lg text-foreground">{profile?.name || "Você"}</h2>
        <p className="text-sm text-muted-foreground font-body">{session?.user?.email}</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          <span className="inline-flex items-center gap-1 text-sm font-display font-bold text-xp">
            <Sparkles className="w-4 h-4" /> {profile?.xp || 0} XP
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-display font-bold text-streak">
            <Flame className="w-4 h-4" /> {profile?.streak || 0} dias
          </span>
        </div>
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 text-xs font-body font-medium bg-secondary/10 text-secondary rounded-full px-3 py-1">
            Nível {profile?.level || 1}
          </span>
        </div>
      </div>

      {/* Partner */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-love/10 flex items-center justify-center text-love font-display font-bold text-lg overflow-hidden">
            {(partnerData?.name || "?")[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-foreground">{partnerData?.name || "Sem parceiro"}</p>
            <p className="text-xs text-muted-foreground font-body">
              Nível {partnerData?.level || 1} · {partnerData?.xp || 0} XP · 🔥 {partnerData?.streak || 0}
            </p>
          </div>
          <Heart className="w-5 h-5 text-love fill-love" />
        </div>
      </div>

      {/* Relationship level */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-love fill-love" />
          <h2 className="font-display font-bold text-foreground text-sm">Nível do Relacionamento</h2>
        </div>
        <div className="space-y-2">
          {relationshipLevel.levels.map((level, i) => (
            <div key={level} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                  i <= relationshipLevel.index
                    ? "bg-love text-love-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-sm font-body ${
                  i <= relationshipLevel.index ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {level}
              </span>
              {i === relationshipLevel.index && (
                <span className="text-xs bg-love/10 text-love rounded-full px-2 py-0.5 font-body font-medium ml-auto">
                  Atual
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite partner */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h2 className="font-display font-bold text-foreground text-sm mb-3">Convidar Parceiro</h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-accent rounded-xl px-3 py-2.5 text-xs font-body text-muted-foreground truncate">
            lovequest.app/invite/{couple?.invite_code || "N/A"}
          </div>
          <Button size="sm" variant="outline" className="rounded-xl">
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Plan */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="font-display font-bold text-foreground text-sm">Plano Gratuito</p>
              <p className="text-xs text-muted-foreground font-body">5 missões · 5 recompensas</p>
            </div>
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground font-display font-bold rounded-xl text-xs">
            Upgrade
          </Button>
        </div>
      </div>

      {/* Settings list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {["Configurações", "Ajuda", "Termos de uso"].map((item, i) => (
          <button
            key={item}
            onClick={item === "Configurações" ? () => navigate("/app/configuracoes") : undefined}
            className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-body text-foreground hover:bg-accent transition-colors ${
              i !== 2 ? "border-b border-border" : ""
            }`}
          >
            <span className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              {item}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        onClick={() => supabase.auth.signOut()}
        className="w-full font-display font-bold rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair
      </Button>
    </div>
  );
};

export default Profile;
