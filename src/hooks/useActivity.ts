import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { subDays, format, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';



export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['achievements', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!session?.user?.id,
  });
}

export function useWeeklyComparison() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);

  return useQuery({
    queryKey: ['weekly-comparison', profile?.couple_id],
    queryFn: async () => {
      if (!profile?.couple_id || !couple || !session?.user?.id) return { chartData: [], userTotal: { xp: 0, missions: 0 }, partnerTotal: { xp: 0, missions: 0 } };

      const userIds = [couple.partner1_id, couple.partner2_id].filter(Boolean);
      const partnerId = couple.partner1_id === session.user.id ? couple.partner2_id : couple.partner1_id;
      
      const today = startOfDay(new Date());
      const sevenDaysAgo = subDays(today, 6); // Last 7 days including today
      const startDate = format(sevenDaysAgo, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at, xp_earned, user_id')
        .in('user_id', userIds)
        .gte('completed_at', startDate);

      if (error) throw error;

      // Group totals
      const userTotal = { xp: 0, missions: 0 };
      const partnerTotal = { xp: 0, missions: 0 };

      // Map completions per day
      const chartMap: Record<string, { name: string; userXP: number; partnerXP: number }> = {};
      
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
      days.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        chartMap[dateKey] = {
          name: format(day, 'EEE', { locale: ptBR }), // Short day name
          userXP: 0,
          partnerXP: 0
        };
      });

      (data || []).forEach(completion => {
        const isUser = completion.user_id === session.user.id;
        const dateStr = completion.completed_at;
        
        if (isUser) {
          userTotal.xp += completion.xp_earned;
          userTotal.missions += 1;
        } else {
          partnerTotal.xp += completion.xp_earned;
          partnerTotal.missions += 1;
        }

        if (chartMap[dateStr]) {
          if (isUser) {
            chartMap[dateStr].userXP += completion.xp_earned;
          } else {
            chartMap[dateStr].partnerXP += completion.xp_earned;
          }
        }
      });

      const chartData = Object.values(chartMap);

      return { chartData, userTotal, partnerTotal };
    },
    enabled: !!profile?.couple_id && !!couple && !!session?.user?.id,
  });
}
