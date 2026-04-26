import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { useSound } from './useSound';
import { toast } from 'sonner';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  type: 'individual' | 'casal' | 'privada';
  xp_value: number;
  is_active: boolean;
  emoji: string | null;
  category: string | null;
  created_at: string;
  couple_id?: string | null;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  xp_earned: number;
}

// ─── Catálogo de Conquistas (fonte única da verdade) ──────────────────────────
export const ACHIEVEMENTS_CATALOG = [
  { title: 'Primeira Missão',  description: 'Você completou sua primeira missão!',  emoji: '⭐' },
  { title: 'Casal em Ação',    description: 'Primeira missão em casal',              emoji: '💑' },
  { title: 'Dedicação',        description: '50 missões completadas',                emoji: '🏆' },
  { title: 'Centurião',        description: 'Ganhe 100 XP',                          emoji: '💯' },
  { title: 'Lendário',         description: 'Alcance o nível 7 (700 XP)',            emoji: '👑' },
  { title: 'Sequência de 7',   description: '7 dias seguidos de missões',            emoji: '🔥' },
  { title: 'Maratonista',      description: '30 dias seguidos de missões',           emoji: '🏅' },
  { title: 'Recompensado',     description: 'Primeira recompensa resgatada',         emoji: '🎁' },
] as const;

export type AchievementTitle = typeof ACHIEVEMENTS_CATALOG[number]['title'];

// ─── useHabits ────────────────────────────────────────────────────────────────
export function useHabits() {
  const { session } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['habits', profile?.couple_id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      let query = supabase.from('habits').select('*').eq('is_active', true);

      if (profile?.couple_id) {
        query = query.or(`couple_id.eq.${profile.couple_id},user_id.eq.${session.user.id}`);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Habit[];
    },
    enabled: !!session?.user?.id,
  });
}

// ─── useCompletions ───────────────────────────────────────────────────────────
// Filtrado corretamente pelos habits do casal atual para evitar vazamento entre casais.
export function useCompletions(date: string) {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: habits = [] } = useHabits();

  return useQuery({
    queryKey: ['completions', date, profile?.couple_id],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      // Coleta os IDs de habits visíveis ao casal atual
      const habitIds = habits.map((h) => h.id);
      if (habitIds.length === 0) return [];

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('completed_at', date)
        .in('habit_id', habitIds);

      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!session?.user?.id && habits.length > 0,
  });
}

// ─── useCompleteHabit — agora via RPC server-side ─────────────────────────────
export function useCompleteHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { playSuccess } = useSound();

  return useMutation({
    mutationFn: async ({ habit, date }: { habit: Habit; date: string }) => {
      if (!session?.user?.id || !profile) throw new Error('Não autenticado');

      const { data, error } = await supabase.rpc('complete_habit_v2', {
        p_habit_id: habit.id,
        p_user_id:  session.user.id,
        p_date:     date,
      });

      if (error) throw error;
      return data as {
        completion_id:    string;
        xp_earned:        number;
        new_xp:           number;
        new_streak:       number;
        new_achievements: Array<{ title: string; emoji: string }>;
      };
    },
    onSuccess: (data, variables) => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['completions', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-goal'] });

      if (data.xp_earned > 0) {
        toast.success(`+${data.xp_earned} XP!`);
      } else {
        toast.success('Missão Privada concluída! 🔒');
      }

      // Notificações de streak
      if (data.new_streak > 1) {
        setTimeout(() => {
          toast.success(`Sequência mantida! ${data.new_streak} dias 🔥`);
        }, 600);
      }

      // Notificações de conquistas desbloqueadas
      if (data.new_achievements && data.new_achievements.length > 0) {
        data.new_achievements.forEach((ach, i) => {
          setTimeout(() => {
            toast.success(`Conquista Desbloqueada: ${ach.title} ${ach.emoji}`, {
              duration: 5000,
            });
          }, 1200 + i * 800);
        });
      }
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Erro ao concluir missão';
      toast.error(msg);
    },
  });
}

// ─── useUncompleteHabit — agora via RPC server-side ──────────────────────────
export function useUncompleteHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!session?.user?.id || !profile) throw new Error('Não autenticado');

      const { data, error } = await supabase.rpc('uncomplete_habit_v2', {
        p_habit_id: habitId,
        p_user_id:  session.user.id,
        p_date:     date,
      });

      if (error) throw error;
      return data as { xp_subtracted: number; new_xp: number; new_streak: number };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['completions', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-goal'] });

      if (data.xp_subtracted > 0) {
        toast.error(`-${data.xp_subtracted} XP (Missão desmarcada)`);
      } else {
        toast.info('Missão Privada desmarcada');
      }
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Erro ao desmarcar missão';
      toast.error(msg);
    },
  });
}

// ─── useCreateHabit ───────────────────────────────────────────────────────────
export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
      if (!session?.user?.id) throw new Error('Não autenticado');

      const coupleIdForHabit = habit.type === 'privada' ? null : profile?.couple_id;

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id:  session.user.id,
          couple_id: coupleIdForHabit,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', profile?.couple_id] });
      toast.success('Missão criada com sucesso!');
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : 'Erro ao criar missão';
      toast.error(msg);
    },
  });
}

// ─── useUpdateHabit ───────────────────────────────────────────────────────────
export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Habit, 'name' | 'xp_value' | 'frequency' | 'category' | 'emoji'>>;
    }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', profile?.couple_id] });
      toast.success('Missão atualizada! ✏️');
    },
    onError: (error: any) => {
      const msg = error?.message || 'Erro ao atualizar missão';
      toast.error(msg);
    },
  });
}

// ─── useDeleteHabit ───────────────────────────────────────────────────────────
export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete: marca como inativa em vez de deletar permanentemente
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id: string) => {
      // Optimistic update: remove imediatamente da UI antes da resposta
      await queryClient.cancelQueries({ queryKey: ['habits', profile?.couple_id] });
      const previous = queryClient.getQueryData<Habit[]>(['habits', profile?.couple_id]);
      queryClient.setQueryData<Habit[]>(
        ['habits', profile?.couple_id],
        (old) => (old ?? []).filter((h) => h.id !== id),
      );
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous?: Habit[] } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(['habits', profile?.couple_id], context.previous);
      }
      toast.error('Erro ao arquivar missão');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', profile?.couple_id] });
      toast.success('Missão arquivada! 📦');
    },
  });
}
