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
  type: 'individual' | 'casal';
  xp_value: number;
  is_active: boolean;
  emoji: string | null;
  category: string | null;
  created_at: string;
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

      // 1. Inserir a completion
      const { error: completionError } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habit.id,
          user_id: session.user.id,
          completed_at: date,
          xp_earned: habit.xp_value,
        });

      if (completionError) throw completionError;

      // 2. Atualizar XP do usuário
      const newXp = (profile.xp || 0) + habit.xp_value;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 3. Increment total completions to check for Dedicação (50 missions)
      const { count: completionCount } = await supabase
        .from('habit_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
        
      const totalCompletions = (completionCount || 0); 
      
      const userStreak = profile.streak || 0;

      // 5. Verificar/Desbloquear conquistas
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

      checkAndAdd('Primeira Missão', 'Você completou sua primeira missão!', '⭐', true);
      checkAndAdd('Casal em Ação', 'Primeira missão em casal', '💑', habit.type === 'casal');
      checkAndAdd('Dedicação', '50 missões completadas', '🏆', totalCompletions >= 50);
      checkAndAdd('Centurião', 'Ganhe 100 XP', '💯', newXp >= 100);
      checkAndAdd('Lendário', 'Alcance o nível 7 (700 XP)', '👑', newXp >= 700);
      checkAndAdd('Sequência de 7', '7 dias seguidos de missões', '🔥', userStreak >= 7);
      checkAndAdd('Maratonista', '30 dias seguidos de missões', '🏅', userStreak >= 30);

      // 6. Insert new achievements
      if (newAchievements.length > 0) {
        const { error: achError } = await supabase.from('achievements').insert(newAchievements);
        if (achError) console.error("Error inserting achievements:", achError);
        else {
          newAchievements.forEach(ach => {
            setTimeout(() => {
              toast.success(`Conquista Desbloqueada: ${ach.title} ${ach.emoji}`);
            }, 500);
          });
        }
      }

      // 7. Notificar parceiro(a)
      const partnerId = couple?.partner1_id === session.user.id ? couple?.partner2_id : couple?.partner1_id;
      if (partnerId) {
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'mission',
          content: `${profile.name || 'Seu par'} completou a missão: ${habit.name}! 🎯`
        });
      }

      return { habit, newXp };
    },
    onSuccess: (data, variables) => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['completions', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(`+${data.habit.xp_value} XP!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao concluir missão");
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

      const { data, error } = await supabase
        .from('habits')
        .insert({
          ...habit,
          user_id: session.user.id,
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
