import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();

  useEffect(() => {
    if (!session?.user?.id || !profile?.couple_id) return;

    const coupleId = profile.couple_id;
    const userId = session.user.id;

    console.log('🔗 Connecting to Supabase Realtime for couple:', coupleId);

    const channel = supabase
      .channel(`couple_${coupleId}`)
      // Profile changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          console.log('🔄 Realtime update: profiles');
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      )
      // Couple changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => {
          console.log('🔄 Realtime update: couples');
          queryClient.invalidateQueries({ queryKey: ['couple'] });
        }
      )
      // Habits/Missions changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits' },
        () => {
          console.log('🔄 Realtime update: habits');
          queryClient.invalidateQueries({ queryKey: ['habits'] });
        }
      )
      // Habit completions changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        () => {
          console.log('🔄 Realtime update: habit_completions');
          queryClient.invalidateQueries({ queryKey: ['completions'] });
          queryClient.invalidateQueries({ queryKey: ['activity'] });
        }
      )
      // Rewards changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards', filter: `couple_id=eq.${coupleId}` },
        () => {
          console.log('🔄 Realtime update: rewards');
          queryClient.invalidateQueries({ queryKey: ['rewards'] });
        }
      )
      // Achievements changes
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'achievements' },
        () => {
          console.log('🔄 Realtime update: achievements');
          queryClient.invalidateQueries({ queryKey: ['achievements'] });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to realtime channel!');
        }
      });

    // Cleanup subscription on unmount or when couple_id changes
    return () => {
      supabase.removeChannel(channel);
      console.log('👋 Disconnected realtime channel');
    };
  }, [session?.user?.id, profile?.couple_id, queryClient]);
}
