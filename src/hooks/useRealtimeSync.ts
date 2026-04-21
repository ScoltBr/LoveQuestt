import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from './useProfile';
import { usePartner } from './usePartner';

const isDev = import.meta.env.DEV;
const log = (...args: unknown[]) => { if (isDev) console.log(...args); };

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { partnerId } = usePartner();               // Usa o novo hook

  useEffect(() => {
    if (!session?.user?.id || !profile?.couple_id) return;

    const coupleId  = profile.couple_id;
    const userId    = session.user.id;
    const pId       = partnerId;                     // pode ser null temporariamente

    log('🔗 Connecting realtime for couple:', coupleId);

    // Filtra profiles apenas pelos IDs do casal para não receber eventos globais
    const profileFilter = pId
      ? `id=in.(${userId},${pId})`
      : `id=eq.${userId}`;

    const channel = supabase
      .channel(`couple_${coupleId}`)
      // Profiles — filtrado por user + partner
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: profileFilter },
        () => { log('🔄 Realtime: profiles'); queryClient.invalidateQueries({ queryKey: ['profile'] }); }
      )
      // Couples — filtrado pelo ID do casal
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'couples', filter: `id=eq.${coupleId}` },
        () => { log('🔄 Realtime: couples'); queryClient.invalidateQueries({ queryKey: ['couple'] }); }
      )
      // Habits — filtrado pelo casal
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `couple_id=eq.${coupleId}` },
        () => { log('🔄 Realtime: habits'); queryClient.invalidateQueries({ queryKey: ['habits', coupleId] }); }
      )
      // Completions — filtrado pelo casal via habit_id não tem suporte direto, mas o refresh é ok
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        () => {
          log('🔄 Realtime: habit_completions');
          queryClient.invalidateQueries({ queryKey: ['completions'] });
          queryClient.invalidateQueries({ queryKey: ['activity'] });
          queryClient.invalidateQueries({ queryKey: ['weekly-goal'] });
        }
      )
      // Rewards — filtrado pelo casal
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rewards', filter: `couple_id=eq.${coupleId}` },
        () => { log('🔄 Realtime: rewards'); queryClient.invalidateQueries({ queryKey: ['rewards'] }); }
      )
      // Achievements — filtrado por userId
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'achievements', filter: `user_id=eq.${userId}` },
        () => { log('🔄 Realtime: achievements'); queryClient.invalidateQueries({ queryKey: ['achievements'] }); }
      )
      // Notificações — filtrado por userId
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { log('🔄 Realtime: notifications'); queryClient.invalidateQueries({ queryKey: ['notifications'] }); }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') log('✅ Realtime connected!');
      });

    return () => {
      supabase.removeChannel(channel);
      log('👋 Realtime disconnected');
    };
  }, [session?.user?.id, profile?.couple_id, partnerId, queryClient]);
}
