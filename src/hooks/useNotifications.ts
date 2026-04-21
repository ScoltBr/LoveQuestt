import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'mission' | 'reward' | 'level' | 'system';
  content: string;
  is_read: boolean;
  created_at: string;
  metadata?: { reward_id?: string; cost?: number; redeemed_by?: string; name?: string; [key: string]: any };
}

import { RewardToast } from '../components/RewardToast';

export function useNotifications() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as AppNotification[];
    },
    enabled: !!session?.user?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`notifications-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', session.user.id] });
          const newNotif = payload.new as AppNotification;
          
          // Show toast for new notification
          if (newNotif.type === 'reward' && newNotif.metadata?.reward_id) {
            toast.custom((t) => <RewardToast notification={newNotif} t={t} />, {
              duration: 10000, // Dá mais tempo para o parceiro ver e clicar
            });
          } else {
            toast(newNotif.content, {
               icon: getIconForType(newNotif.type)
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

  return query;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', session.user.id)
        .eq('is_read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', session?.user?.id] });
    },
  });
}

function getIconForType(type: string) {
  switch (type) {
    case 'mission': return '🎯';
    case 'reward': return '🎁';
    case 'level': return '🆙';
    default: return '🔔';
  }
}
