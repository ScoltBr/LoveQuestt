import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { useSound } from './useSound';
import { toast } from 'sonner';
import { parseISO, differenceInCalendarDays } from 'date-fns';

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

export function useCompletions(date: string) {
  const { session } = useAuth();
  
  return useQuery({
    queryKey: ['completions', date],
    queryFn: async () => {
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('completed_at', date);
        
      if (error) throw error;
      return data as HabitCompletion[];
    },
    enabled: !!session?.user?.id,
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { playSuccess } = useSound();
  
  return useMutation({
    mutationFn: async ({ habit, date }: { habit: Habit; date: string }) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");

      const xpToEarn = habit.type === 'privada' ? 0 : habit.xp_value;

      // 1. Inserir a completion
      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habit.id,
          user_id: session.user.id,
          completed_at: date,
          xp_earned: xpToEarn,
        });

      if (completionError) throw completionError;

      // 2. Calcular Sequência (Streak)
      let newStreak = profile.streak || 0;
      
      // Buscar a última conclusão (excluindo a atual)
      const { data: lastCompletions } = await supabase
        .from('habit_completions')
        .select('completed_at')
        .eq('user_id', session.user.id)
        .lt('completed_at', date)
        .order('completed_at', { ascending: false })
        .limit(1);

      const lastDate = lastCompletions?.[0]?.completed_at;
      // Fix: usar parseISO + T00:00:00 para tratar como hora local e evitar offset de timezone
      const today = parseISO(date + 'T00:00:00');
      
      if (lastDate) {
        const last = parseISO(lastDate + 'T00:00:00');
        const diffDays = differenceInCalendarDays(today, last);
        
        if (diffDays === 1) {
          // Completou ontem, incrementa streak (apenas se for a primeira missão do dia)
          const { count: todayCount } = await supabase
            .from('habit_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('completed_at', date);
            
          if ((todayCount || 0) <= 1) { // <= 1 pois já inserimos a atual no passo 1
            newStreak += 1;
            toast.success(`Sequência mantida! ${newStreak} dias 🔥`);
          }
        } else if (diffDays > 1) {
          // Quebrou a sequência
          newStreak = 1;
        }
      } else {
        // Primeira missão da história
        newStreak = 1;
      }

      // 3. Atualizar Perfil (XP e Streak)
      // O Level é atualizado via Trigger no Banco de Dados
      const newXp = (profile.xp || 0) + xpToEarn;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp,
          streak: newStreak
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 4. Buscar conquistas existentes para evitar duplicatas
      const { data: existingAchs } = await supabase
        .from('achievements')
        .select('title')
        .eq('user_id', session.user.id);
        
      const unlockedTitles = new Set(existingAchs?.map(a => a.title) || []);
      const newAchievements: { user_id: string, title: string, description: string, emoji: string }[] = [];

      const checkAndAdd = (title: string, desc: string, emoji: string, condition: boolean) => {
        if (condition && !unlockedTitles.has(title)) {
          newAchievements.push({ user_id: session.user.id, title, description: desc, emoji });
        }
      };

      // 5. Verificar total de missões para "Dedicação"
      const { count: completionCount } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
        
      const totalCompletions = (completionCount || 0);

      checkAndAdd('Primeira Missão', 'Você completou sua primeira missão!', '⭐', true);
      checkAndAdd('Casal em Ação', 'Primeira missão em casal', '💑', habit.type === 'casal');
      checkAndAdd('Dedicação', '50 missões completadas', '🏆', totalCompletions >= 50);
      checkAndAdd('Centurião', 'Ganhe 100 XP', '💯', newXp >= 100);
      checkAndAdd('Lendário', 'Alcance o nível 7 (700 XP)', '👑', newXp >= 700);
      checkAndAdd('Sequência de 7', '7 dias seguidos de missões', '🔥', newStreak >= 7);
      checkAndAdd('Maratonista', '30 dias seguidos de missões', '🏅', newStreak >= 30);

      // 6. Inserir novas conquistas
      if (newAchievements.length > 0) {
        const { error: achError } = await supabase.from('achievements').insert(newAchievements);
        if (achError) {
          console.error("Erro ao salvar conquistas:", achError);
          // Não lançamos erro aqui para não travar a conclusão da missão
        } else {
          newAchievements.forEach(ach => {
            setTimeout(() => {
              toast.success(`Conquista Desbloqueada: ${ach.title} ${ach.emoji}`, {
                duration: 5000,
              });
            }, 1000);
          });
        }
      }

      // 7. Notificar parceiro(a)
      const partnerId = couple?.partner1_id === session.user.id ? couple?.partner2_id : couple?.partner1_id;
      if (partnerId && habit.type !== 'privada') {
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'mission',
          content: `${profile.name || 'Seu par'} completou a missão: ${habit.name}! 🎯`
        });
      }
      return { habit, newXp, xpToEarn };
    },
    onSuccess: (data, variables) => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['completions', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      if (data.xpToEarn > 0) {
        toast.success(`+${data.xpToEarn} XP!`);
      } else {
        toast.success(`Missão Privada concluída! 🔒`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao concluir missão");
    }
  });
}

export function useUncompleteHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");

      // 1. Buscar a conclusão específica
      const { data: completion, error: fetchError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('habit_id', habitId)
        .eq('user_id', session.user.id)
        .eq('completed_at', date)
        .single();

      if (fetchError || !completion) throw new Error("Conclusão não encontrada");

      // 2. Deletar a conclusão
      const { error: deleteError } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', completion.id);

      if (deleteError) throw deleteError;

      // 3. Atualizar XP e Streak
      const xpToSubtract = completion.xp_earned || 0;
      let newStreak = profile.streak || 0;

      // Verificar se ainda existem conclusões hoje
      const { count: remainingToday } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('completed_at', date);

      if ((remainingToday || 0) === 0) {
        // Se era a última missão do dia, o streak "volta" um dia (se fosse > 0)
        newStreak = Math.max(0, newStreak - 1);
      }

      const newXp = Math.max(0, (profile.xp || 0) - xpToSubtract);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXp,
          streak: newStreak
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      return { habitId, xpSubtracted: xpToSubtract };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['completions', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      if (data.xpSubtracted > 0) {
        toast.error(`-${data.xpSubtracted} XP (Missão desmarcada)`);
      } else {
        toast.info(`Missão Privada desmarcada`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao desmarcar missão");
    }
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
      if (!session?.user?.id) throw new Error("Não autenticado");

      const coupleIdForHabit = habit.type === 'privada' ? null : profile?.couple_id;

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id: session.user.id,
          couple_id: coupleIdForHabit,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Habit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', profile?.couple_id] });
      toast.success("Missão criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar missão");
    }
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<Habit, 'name' | 'xp_value' | 'frequency' | 'category' | 'emoji'>> }) => {
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
      toast.error(error.message || 'Erro ao atualizar missão');
    },
  });
}

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
        (old) => (old ?? []).filter((h) => h.id !== id)
      );
      return { previous };
    },
    onError: (_err: any, _id: string, context: any) => {
      // Rollback se o servidor retornar erro
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
