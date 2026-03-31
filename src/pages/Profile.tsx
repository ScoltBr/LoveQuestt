import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useCouple } from "@/hooks/useProfile";
import { useCoupleStats, COUPLE_LEVELS } from "@/hooks/useCoupleStats";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  LogOut,
  Crown,
  Settings,
  Users,
  Flame,
  Sparkles,
  ChevronRight,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Profile = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { level: relationshipLevel, coupleXp } = useCoupleStats();
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;

  // Progressão do Nível do Casal (Estilo Battle Pass)
  const currentLevelIndex = relationshipLevel.index;
  const currentLevelMinXp = COUPLE_LEVELS[currentLevelIndex]?.minXp || 0;
  const nextLevelXp = relationshipLevel.nextLevelXp;
  
  const progressInLevel = Math.max(0, coupleXp - currentLevelMinXp);
  const totalLevelXp = Math.max(1, nextLevelXp - currentLevelMinXp);
  const percentToNextLevel = Math.min(100, (progressInLevel / totalLevelXp) * 100);

  const copyInvite = () => {
    navigator.clipboard.writeText(`lovequest.app/invite/${couple?.invite_code}`);
    alert("Código copiado!"); // Poderíamos usar um Toast aqui
  };

  return (
    <div className="px-4 pt-6 space-y-6 pb-24 max-w-md mx-auto relative">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-black text-foreground font-display tracking-tight">Dossiê</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/configuracoes")} className="rounded-full text-muted-foreground hover:bg-foreground/5 transition-colors">
          <Settings className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* LAYER 1: PLAYER / COUPLE CARDS */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="flex gap-4">
        
        {/* Player 1 (Vocé) */}
        <div className="flex-1 glass rounded-3xl p-5 flex flex-col items-center relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -mt-6 -mr-6 pointer-events-none" />
          
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-primary to-love flex items-center justify-center p-[2px] shadow-lg shadow-primary/20">
              <div className="w-full h-full bg-card rounded-[20px] flex items-center justify-center text-primary font-display font-black text-3xl">
                {(profile?.name || "U")[0].toUpperCase()}
              </div>
            </div>
            {/* Level Badge */}
            <div className="absolute -bottom-3 -right-3 w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-md border border-border/50">
              <div className="w-[26px] h-[26px] rounded-full bg-xp flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                {profile?.level || 1}
              </div>
            </div>
          </div>
          
          <h2 className="font-display font-black text-[17px] text-foreground truncate w-full text-center mt-2">{profile?.name || "Você"}</h2>
          <span className="text-[10px] text-primary font-black tracking-widest uppercase mb-4 opacity-80">Player 1</span>
          
          {/* Mini Stats Grid */}
          <div className="w-full flex justify-center gap-4 bg-background/50 py-2 rounded-2xl border border-white/5 dark:border-white/5">
            <div className="flex flex-col items-center">
              <Sparkles className="w-[14px] h-[14px] text-xp text-glow-sm" />
              <span className="text-xs font-black text-foreground mt-1">{profile?.xp || 0}</span>
            </div>
            <div className="w-px h-6 bg-border/80" />
            <div className="flex flex-col items-center">
              <Flame className="w-[14px] h-[14px] text-streak text-glow-sm" />
              <span className="text-xs font-black text-foreground mt-1">{profile?.streak || 0}</span>
            </div>
          </div>
        </div>

        {/* Player 2 (Parceiro) ou Invite */}
        {partnerData ? (
          <div className="flex-1 glass rounded-3xl p-5 flex flex-col items-center relative overflow-hidden opacity-95 hover:opacity-100 transition-opacity shadow-lg">
            <div className="absolute top-0 left-0 w-24 h-24 bg-love/20 rounded-full blur-2xl -mt-6 -ml-6 pointer-events-none" />
            
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-[22px] bg-gradient-to-bl from-secondary to-love flex items-center justify-center p-[2px] shadow-lg shadow-love/20">
                <div className="w-full h-full bg-card rounded-[20px] flex items-center justify-center text-love font-display font-black text-3xl">
                  {partnerData.name[0].toUpperCase()}
                </div>
              </div>
              <div className="absolute -bottom-3 -left-3 w-8 h-8 rounded-full bg-background flex items-center justify-center shadow-md border border-border/50">
                <div className="w-[26px] h-[26px] rounded-full bg-love flex items-center justify-center text-white text-[10px] font-black shadow-inner">
                  {partnerData.level || 1}
                </div>
              </div>
            </div>
            
            <h2 className="font-display font-black text-[17px] text-foreground truncate w-full text-center mt-2">{partnerData.name}</h2>
            <span className="text-[10px] text-love font-black tracking-widest uppercase mb-4 opacity-80">Player 2</span>
            
            <div className="w-full flex justify-center gap-4 bg-background/50 py-2 rounded-2xl border border-white/5 dark:border-white/5">
              <div className="flex flex-col items-center">
                <Sparkles className="w-[14px] h-[14px] text-xp text-glow-sm" />
                <span className="text-xs font-black text-foreground mt-1">{partnerData.xp || 0}</span>
              </div>
              <div className="w-px h-6 bg-border/80" />
              <div className="flex flex-col items-center">
                <Flame className="w-[14px] h-[14px] text-streak text-glow-sm" />
                <span className="text-xs font-black text-foreground mt-1">{partnerData.streak || 0}</span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex-1 glass rounded-3xl p-5 flex flex-col items-center justify-center border-dashed border-2 border-primary/20 cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5 shadow-sm group" 
            onClick={copyInvite}
          >
            <div className="w-16 h-16 rounded-[20px] bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display font-black text-sm text-center text-foreground mb-1 leading-tight">Convidar<br/>Parceiro(a)</h2>
            <div className="mt-4 bg-background w-full rounded-xl px-2 py-2 text-[11px] font-mono text-primary font-black border border-primary/20 text-center truncate">
              {couple?.invite_code || "GERANDO..."}
            </div>
          </div>
        )}
      </motion.div>

      {/* LAYER 2: RELATIONSHIP BATTLE PASS */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-3xl p-6 shadow-md border-t border-white/40 dark:border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Heart className="w-[18px] h-[18px] text-love fill-love text-glow-sm" />
            <h2 className="font-display font-black text-foreground text-sm tracking-wide">Laço Principal</h2>
          </div>
          <span className="bg-love/10 text-love text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-inner">
            {relationshipLevel.name}
          </span>
        </div>
        
        <div className="relative pt-6 pb-2">
          {/* Track Foundation */}
          <div className="absolute top-9 left-0 w-full h-3 bg-background rounded-full overflow-hidden shadow-inner border border-border/50">
            {/* The Filler */}
            <div 
              className="h-full bg-gradient-to-r from-primary to-love transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,77,109,0.8)] relative" 
              style={{ width: `${percentToNextLevel}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
            </div>
          </div>
           
           {/* Step Targets */}
          <div className="relative flex justify-between z-10 -mt-2">
            
            {/* Current Level Node */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 text-white font-black text-[13px] ring-[3px] ring-background relative">
                {currentLevelIndex + 1}
                <div className="absolute inset-0 rounded-full border border-white/30" />
              </div>
              <span className="text-[9px] font-black text-primary mt-2 uppercase tracking-widest">Atual</span>
            </div>
            
             {/* Next Level Node */}
             <div className="flex flex-col items-center opacity-60">
              <div className="w-8 h-8 rounded-full bg-card border-2 border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground font-black text-[13px] ring-[3px] ring-background">
                {currentLevelIndex + 2}
              </div>
              <span className="text-[9px] font-black text-muted-foreground mt-2 uppercase tracking-widest">{nextLevelXp} XP</span>
            </div>
            
          </div>
        </div>
        
        <p className="text-center text-[11px] text-muted-foreground mt-4 font-medium uppercase tracking-wider">
          Faltam <strong className="text-foreground font-black text-[12px]">{nextLevelXp - coupleXp} XP</strong> para o próximo nível
        </p>
      </motion.div>

      {/* LAYER 3: PREMIUM BANNER */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-3xl p-7 animated-mesh relative overflow-hidden group shadow-xl">
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-warning/20 rounded-[20px] flex items-center justify-center mb-4 backdrop-blur-md border border-warning/40 shadow-[0_0_20px_rgba(255,204,0,0.5)] transform -rotate-12 group-hover:rotate-0 transition-all duration-300">
             <Crown className="w-7 h-7 text-warning fill-warning/20 text-glow" />
          </div>
          <h2 className="text-2xl font-display font-black text-white mb-2 drop-shadow-lg tracking-tight">LoveQuest PRO</h2>
          <p className="text-[13px] text-white/90 mb-6 max-w-[220px] mx-auto drop-shadow-md font-medium leading-relaxed">
            Missões ilimitadas, recompensas exclusivas mensais e avatares dinâmicos.
          </p>
          <Button size="lg" className="w-full bg-white text-primary hover:bg-gray-100 font-display font-black rounded-[14px] text-sm shadow-2xl transition-transform active:scale-95 h-12 uppercase tracking-wide">
            Desbloquear Acesso
          </Button>
        </div>
      </motion.div>

      {/* LAYER 4: SYSTEM CONTROL CENTER */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-3xl overflow-hidden p-1 shadow-sm">
        {[
          { icon: Settings, label: "Ajustes da Conta", path: "/app/configuracoes" },
          { icon: Shield, label: "Privacidade e Termos", path: "#" },
          { icon: Star, label: "Avalie com 5 Estrelas", path: "#" }
        ].map((item, i) => (
          <button
            key={item.label}
            onClick={() => item.path !== "#" && navigate(item.path)}
            className="w-full flex items-center justify-between p-4 text-sm font-body text-foreground hover:bg-foreground/5 transition-colors rounded-[20px] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[14px] bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="font-bold tracking-tight">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
          </button>
        ))}
        
        {/* Sair/Logout com destaque */}
        <div className="px-3 py-3 pb-3 mt-2">
          <Button
            variant="outline"
            onClick={() => supabase.auth.signOut()}
            className="w-full font-display font-black rounded-[16px] text-destructive border-destructive/20 hover:bg-destructive/10 bg-destructive/5 py-6 uppercase tracking-widest text-[11px]"
          >
            <LogOut className="w-[14px] h-[14px] mr-2" />
            Desconectar Dispositivo
          </Button>
        </div>
      </motion.div>

    </div>
  );
};

export default Profile;
