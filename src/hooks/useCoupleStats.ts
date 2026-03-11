import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export const COUPLE_LEVELS = [
  { name: "Início da Jornada", minXp: 0 },
  { name: "Companheiros", minXp: 500 },
  { name: "Parceiros", minXp: 1500 },
  { name: "Duo Imbatível", minXp: 3000 },
  { name: "Almas Gêmeas", minXp: 5000 }
];

export function useCoupleStats() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  
  // 1. Calcular Nível do Casal baseado na soma do XP de ambos
  const partnerData = couple?.partner1?.id === profile?.id ? couple?.partner2 : couple?.partner1;
  const totalCoupleXp = (profile?.xp || 0) + (partnerData?.xp || 0);
  
  const currentLevelIndex = [...COUPLE_LEVELS].reverse().findIndex(l => totalCoupleXp >= l.minXp);
  const currentLevelIdx = currentLevelIndex === -1 ? 0 : COUPLE_LEVELS.length - 1 - currentLevelIndex;
  
  const currentLevel = COUPLE_LEVELS[currentLevelIdx];
  const nextLevel = COUPLE_LEVELS[currentLevelIdx + 1] || null;

  // 2. Calcular Meta da Semana (Segunda a Domingo)
  const today = new Date();
  const start = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const end = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const weeklyGoalQuery = useQuery({
    queryKey: ['weekly-goal', profile?.couple_id, start],
    queryFn: async () => {
      if (!profile?.couple_id) return 0;
      
      const userIds = [couple?.partner1_id, couple?.partner2_id].filter(Boolean);
      
      const { count, error } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .gte('completed_at', start)
        .lte('completed_at', end);
        
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.couple_id && !!couple,
  });

  return {
    coupleXp: totalCoupleXp,
    level: {
      name: currentLevel.name,
      index: currentLevelIdx,
      levels: COUPLE_LEVELS.map(l => l.name),
      xp: totalCoupleXp,
      nextLevelXp: nextLevel ? nextLevel.minXp : totalCoupleXp,
    },
    weeklyGoal: {
      target: 15,
      completed: weeklyGoalQuery.data || 0,
      reward: 100,
      isLoading: weeklyGoalQuery.isLoading
    }
  };
}
