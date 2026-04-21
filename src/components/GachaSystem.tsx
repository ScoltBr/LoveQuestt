import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Gem, Crown, Lock, Sparkles, AlertCircle, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from '../hooks/useProfile';
import { useCoupleStats } from '../hooks/useCoupleStats';
import { useWeeklyGachaStatus, useOpenGacha, CHEST_COSTS, LootItem } from '../hooks/useGacha';
import confetti from 'canvas-confetti';
import { GachaAdminModal } from './GachaAdminModal';

export function GachaSystem() {
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { weeklyGoal } = useCoupleStats();
  const { data: hasOpenedWeekly, isLoading: loadingStatus } = useWeeklyGachaStatus();
  const openGacha = useOpenGacha();

  const [openingChest, setOpeningChest] = useState<'weekly' | 'premium' | 'legendary' | null>(null);
  const [reward, setReward] = useState<LootItem | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const canOpenWeekly = weeklyGoal.completed >= weeklyGoal.target;
  const missingWeekly = Math.max(0, weeklyGoal.target - weeklyGoal.completed);

  const handleOpen = async (type: 'weekly' | 'premium' | 'legendary') => {
    try {
      setOpeningChest(type);
      
      // Artificial delay just to show the shaking animation
      const response = await openGacha.mutateAsync(type);
      
      setTimeout(() => {
        setReward(response.reward);
        triggerConfetti(response.reward.rarity);
        setOpeningChest(null);
      }, 1500); // 1.5s of shaking

    } catch (err) {
      setOpeningChest(null);
      // Erro already handled by toast in the hook
    }
  };

  const triggerConfetti = (rarity: string) => {
    const isEpic = rarity === 'épico' || rarity === 'incomum';
    const isLegendary = rarity === 'lendario';
    
    const count = isLegendary ? 200 : isEpic ? 100 : 50;
    const spread = isLegendary ? 100 : 70;
    const zIndex = 9999;
    
    // Fire confetti from bottom center
    confetti({
      particleCount: count,
      spread: spread,
      origin: { y: 0.8 },
      zIndex,
      colors: isLegendary ? ['#FFD700', '#FFA500', '#FF8C00'] : undefined
    });
  };

  const renderRewardModal = () => {
    if (!reward) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setReward(null)}
        >
          <motion.div 
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`w-full max-w-sm rounded-3xl p-1 bg-gradient-to-b ${
              reward.rarity === 'lendario' ? 'from-yellow-400 via-yellow-600 to-yellow-900' :
              reward.rarity === 'incomum' ? 'from-purple-500 via-pink-500 to-purple-900' :
              'from-emerald-400 to-emerald-900'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-950 rounded-[22px] p-8 text-center flex flex-col items-center">
              <span className="text-sm font-bold tracking-widest uppercase mb-4" style={{
                color: reward.rarity === 'lendario' ? '#FFD700' : reward.rarity === 'incomum' ? '#D946EF' : '#34D399'
              }}>
                {reward.rarity === 'lendario' ? 'Recompensa Lendária!!' : 
                 reward.rarity === 'incomum' ? 'Recompensa Épica!' : 
                 'Recompensa Comum'}
              </span>

              <div className="w-32 h-32 flex items-center justify-center bg-white/5 rounded-full mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <span className="text-6xl drop-shadow-lg">{reward.emoji}</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{reward.name}</h2>
              <p className="text-slate-400 mb-8">
                {reward.type === 'xp' 
                  ? `Vocês ganharam +${reward.value} XP direto pro casal!`
                  : `Vale recebido: "${reward.value}". (Disponível na loja do parceiro)`}
              </p>

              <button 
                onClick={() => setReward(null)}
                className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all border border-white/20"
              >
                Incrível!
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // MAINTENANCE MODE (Feature Toggled Off)
  if (couple && couple.gacha_enabled === false) {
    return (
      <div className="w-full bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-10 relative overflow-hidden text-center grayscale-[0.5]">
         <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
         <AlertCircle className="w-12 h-12 text-rose-500/50 mx-auto mb-4" />
         <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wider">Sala de Baús Trancada</h2>
         <p className="text-slate-400 text-sm max-w-sm mx-auto">
           O sistema Gacha foi suspenso temporariamente pela Central de Comando. Aproveite para focar nas missões!
         </p>

         {/* Se o usuário atual for o Mestre (quem abre o admin), ele ainda tem o botão Settings para não ficar preso */}
         <button 
            onClick={() => setIsAdminOpen(true)}
            className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-white inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
          >
            <Settings className="w-4 h-4" />
            Configurar
         </button>

         <GachaAdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            Sala de Baús
          </h2>
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            title="Configurar Prêmios"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-6">
          Gaste seu XP com sabedoria ou complete a meta semanal para ganhar recompensas épicas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* CHEST 1: WEEKLY */}
          <ChestCard
            title="Baú Semanal"
            icon={<Gift className="w-10 h-10" />}
            color="emerald"
            isLocked={!canOpenWeekly}
            alreadyOpened={hasOpenedWeekly}
            lockedMessage={hasOpenedWeekly ? "Já Aberto!" : `Faltam ${missingWeekly} missões`}
            cost={CHEST_COSTS.weekly}
            onOpen={() => handleOpen('weekly')}
            isOpening={openingChest === 'weekly'}
            isLoading={loadingStatus}
          />

          {/* CHEST 2: PREMIUM */}
          <ChestCard
            title="Baú Mágico"
            icon={<Gem className="w-10 h-10" />}
            color="fuchsia"
            isLocked={(profile?.xp || 0) < CHEST_COSTS.premium}
            alreadyOpened={false}
            cost={CHEST_COSTS.premium}
            onOpen={() => handleOpen('premium')}
            isOpening={openingChest === 'premium'}
          />

          {/* CHEST 3: LEGENDARY */}
          <ChestCard
            title="Baú Galático"
            icon={<Crown className="w-10 h-10" />}
            color="yellow"
            isLocked={(profile?.xp || 0) < CHEST_COSTS.legendary}
            alreadyOpened={false}
            cost={CHEST_COSTS.legendary}
            onOpen={() => handleOpen('legendary')}
            isOpening={openingChest === 'legendary'}
          />

        </div>
      </div>

      {renderRewardModal()}
      
      {/* Admin Modal */}
      <GachaAdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}

// ----- 

interface ChestCardProps {
  title: string;
  icon: React.ReactNode;
  color: 'emerald' | 'fuchsia' | 'yellow';
  cost: number;
  isLocked: boolean;
  alreadyOpened: boolean;
  lockedMessage?: string;
  onOpen: () => void;
  isOpening: boolean;
  isLoading?: boolean;
}

function ChestCard({ title, icon, color, cost, isLocked, alreadyOpened, lockedMessage, onOpen, isOpening, isLoading }: ChestCardProps) {
  
  const aesthetics = {
    emerald: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/20 hover:border-emerald-400/50',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)]',
      text: 'text-emerald-400',
      pedestal: 'from-emerald-500/0 via-emerald-500/20 to-emerald-500/0',
      core: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[inset_0_0_20px_rgba(16,185,129,0.2)]',
      rays: 'bg-emerald-400/20'
    },
    fuchsia: {
      bg: 'bg-fuchsia-950/30',
      border: 'border-fuchsia-500/20 hover:border-fuchsia-400/50',
      glow: 'shadow-[0_0_30px_rgba(217,70,239,0.1)] hover:shadow-[0_0_40px_rgba(217,70,239,0.3)]',
      text: 'text-fuchsia-400',
      pedestal: 'from-fuchsia-500/0 via-fuchsia-500/20 to-fuchsia-500/0',
      core: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 shadow-[inset_0_0_20px_rgba(217,70,239,0.2)]',
      rays: 'bg-fuchsia-400/20'
    },
    yellow: {
      bg: 'bg-amber-950/30',
      border: 'border-yellow-500/20 hover:border-yellow-400/50',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.1)] hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]',
      text: 'text-yellow-400',
      pedestal: 'from-yellow-500/0 via-yellow-500/20 to-yellow-500/0',
      core: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300 shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]',
      rays: 'bg-yellow-400/20'
    },
  };

  const theme = aesthetics[color];
  const isActuallyLocked = isLocked || alreadyOpened || isLoading;

  return (
    <div className={`relative rounded-3xl border p-6 flex flex-col items-center text-center overflow-hidden transition-all duration-500 group
      ${isActuallyLocked ? 'border-white/5 bg-slate-900/60 opacity-80 backdrop-blur-md grayscale-[0.3]' 
      : `${theme.bg} ${theme.border} ${theme.glow} backdrop-blur-md hover:-translate-y-2`}
    `}>
      
      {/* Fundo decorativo giratório (Aura) */}
      {!isActuallyLocked && (
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 20, ease: "linear", repeat: Infinity }}
           className={`absolute top-1/2 left-1/2 -ml-24 -mt-24 w-48 h-48 opacity-30 blur-2xl rounded-full ${theme.rays}`}
        />
      )}

      {/* Título do Baú */}
      <h3 className={`font-display font-black text-lg tracking-wide uppercase z-10 mb-6 drop-shadow-md ${isActuallyLocked ? 'text-slate-400' : 'text-white'}`}>
        {title}
      </h3>

      {/* O Baú e a Magia */}
      <div className="relative w-full flex justify-center mb-8 h-28 items-center z-10">
        
        {/* Pedestal Luminoso (Linha inferior) */}
        {!isActuallyLocked && (
           <div className={`absolute bottom-0 w-3/4 h-[2px] bg-gradient-to-r ${theme.pedestal} blur-[1px]`} />
        )}
        {!isActuallyLocked && (
           <div className={`absolute bottom-0 w-1/2 h-[1px] bg-gradient-to-r ${theme.pedestal}`} />
        )}

        <motion.div
          animate={isOpening ? 
            { 
              rotate: [0, -10, 10, -10, 10, 0], 
              scale: [1, 1.2, 1.2, 1.2, 1.2, 1],
              y: [0, -20, -20, -20, -20, 0]
            } : 
            { rotate: 0, scale: 1, y: 0 }
          }
          transition={{ duration: 0.6, ease: "easeInOut", repeat: isOpening ? Infinity : 0 }}
          whileHover={!isActuallyLocked && !isOpening ? { y: -8, scale: 1.05 } : {}}
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center relative backdrop-blur-lg transform-gpu ${
            isActuallyLocked 
              ? 'bg-slate-800/80 border border-slate-700/50 text-slate-500 shadow-inner' 
              : `${theme.core} border-b-0`
          }`}
        >
          {icon}

          {/* Partículas de brilo estáticas saindo da caixa */}
          {!isActuallyLocked && !isOpening && (
            <>
              <Sparkles className="absolute -top-3 -right-3 w-6 h-6 animate-pulse opacity-70" />
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white opacity-40" />
            </>
          )}

          {/* Ícone de Cadeado se estiver trancado por missões */}
          {isActuallyLocked && !alreadyOpened && (
            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center shadow-lg">
              <Lock className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Condições e Custos */}
      <div className="mt-auto w-full z-10 flex flex-col items-center">
        {cost === 0 ? (
          <p className="text-[11px] font-bold text-slate-400 mb-4 h-4 uppercase tracking-wider">
            {lockedMessage || 'Gratuito na Meta'}
          </p>
        ) : (
          <div className={`text-xs font-bold mb-4 h-6 px-4 py-1 rounded-full border ${isActuallyLocked ? 'border-slate-700 bg-slate-800 text-slate-500' : 'border-white/10 bg-black/30 text-white'}`}>
            Custo: <span className={!isActuallyLocked ? theme.text : ''}>{cost} XP</span>
          </div>
        )}

        {/* Botão de Ação */}
        <button
          onClick={onOpen}
          disabled={isActuallyLocked || isOpening}
          className={`w-full py-3 text-sm rounded-xl font-black uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2
            ${alreadyOpened ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed' : 
              isActuallyLocked ? 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed' : 
              'bg-gradient-to-b from-white to-slate-200 text-slate-900 shadow-[0_10px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.4)] active:scale-95 hover:-translate-y-1'
            }`}
        >
          {isOpening ? 'Abrindo...' : 
           alreadyOpened ? 'Esgotado' : 
           isLocked ? 'Trancado' : 'Abrir'}
        </button>
      </div>
    </div>
  );
}
