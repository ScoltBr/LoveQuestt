import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { subDays, format, startOfDay, eachDayOfInterval, isSameDay } from 'date-fns';

export interface DayActivity {
  level: number;
  date: string;
  missions: number;
}

export function useActivityData() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);

  return useQuery({
    queryKey: ['activity-data', profile?.couple_id],
    queryFn: async () => {
      if (!profile?.couple_id || !couple) return [];

      const userIds = [couple.partner1_id, couple.partner2_id].filter(Boolean);
      const today = startOfDay(new Date());
      const twelveWeeksAgo = subDays(today, 83); // 12 weeks total including today
      const startDate = format(twelveWeeksAgo, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('habit_completions')
        .select('completed_at, xp_earned')
        .in('user_id', userIds)
        .gte('completed_at', startDate);

      if (error) throw error;

      // Group by date string to avoid TZ issues
      const completionsByDate = (data || []).reduce((acc: any, curr) => {
        const dateStr = curr.completed_at; // it's already yyyy-MM-dd
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
      }, {});

      // Map completions to specific days
      const days = eachDayOfInterval({
        start: twelveWeeksAgo,
        end: today
      });

      const processedData: DayActivity[][] = [];
      let currentWeek: DayActivity[] = [];

      days.forEach((day, index) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const missions = completionsByDate[dateKey] || 0;
        
        // Intensity level calculation (0 to 4)
        const level = missions === 0 ? 0 
                    : missions === 1 ? 1 
                    : missions <= 2 ? 2 
                    : missions <= 4 ? 3 
                    : 4;

        currentWeek.push({
          level,
          missions,
          date: format(day, 'dd/MM')
        });

        // Split into weeks (every 7 days)
        if (currentWeek.length === 7 || index === days.length - 1) {
          processedData.push(currentWeek);
          currentWeek = [];
        }
      });

      return processedData;
    },
    enabled: !!profile?.couple_id && !!couple,
  });
}

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
