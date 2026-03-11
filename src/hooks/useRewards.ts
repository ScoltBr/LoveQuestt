import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { useSound } from './useSound';
import { toast } from 'sonner';

export interface Reward {
  id: string;
  created_by: string;
  couple_id: string;
  name: string;
  cost: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
  emoji: string | null;
  status?: 'available' | 'pending' | 'approved' | 'completed' | 'rejected';
  redeemed_by?: string | null;
  is_reusable?: boolean;
}

export function useRewards() {
  const { session } = useAuth();
  const { data: profile } = useProfile();
  
  return useQuery({
    queryKey: ['rewards', profile?.couple_id],
    queryFn: async () => {
      if (!session?.user?.id || !profile?.couple_id) return [];

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Reward[];
    },
    enabled: !!session?.user?.id && !!profile?.couple_id,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async (reward: Omit<Reward, 'id' | 'created_by' | 'couple_id' | 'created_at' | 'is_redeemed' | 'redeemed_at'>) => {
      if (!session?.user?.id || !profile?.couple_id) throw new Error("Não autenticado ou sem casal");

      const { data, error } = await supabase
        .from('rewards')
        .insert({
          ...reward,
          created_by: session.user.id,
          couple_id: profile.couple_id,
          is_redeemed: false,
          status: 'available',
          is_reusable: reward.is_reusable || false
        })
        .select()
        .single();

      if (error) throw error;
      return data as Reward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards', profile?.couple_id] });
      toast.success("Recompensa criada! 🎁");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar recompensa");
    }
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);
  const { playSuccess } = useSound();

  return useMutation({
    mutationFn: async (reward: Reward) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");
      
      if (profile.xp < reward.cost) {
        throw new Error(`XP insuficiente. Precisa de ${reward.cost} XP.`);
      }

      if (reward.is_reusable) {
        const { error: insertError } = await supabase
          .from('rewards')
          .insert({
            name: reward.name,
            cost: reward.cost,
            emoji: reward.emoji,
            couple_id: profile.couple_id,
            created_by: reward.created_by,
            is_redeemed: true,
            status: 'pending',
            redeemed_by: session.user.id,
            redeemed_at: new Date().toISOString(),
            is_reusable: false
          });
        
        if (insertError) throw insertError;
      } else {
        const { error: rewardError } = await supabase
          .from('rewards')
          .update({ 
            is_redeemed: true, 
            redeemed_at: new Date().toISOString(),
            status: 'pending',
            redeemed_by: session.user.id
          })
          .eq('id', reward.id);

        if (rewardError) throw rewardError;
      }

      const newXp = profile.xp - reward.cost;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Notify partner
      const partnerId = couple?.partner1_id === session.user.id ? couple?.partner2_id : couple?.partner1_id;
      if (partnerId) {
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'reward',
          content: `${profile.name || 'Seu par'} quer resgatar: ${reward.emoji} ${reward.name}! ✨`
        });
      }

      return { reward, newXp };
    },
    onSuccess: (data) => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['rewards', profile?.couple_id] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success("Resgate solicitado! ⏳", {
        description: `Seu parceiro precisa aprovar.`,
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao solicitar resgate");
    }
  });
}

export function useApproveReward() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { playNotification } = useSound();

  return useMutation({
    mutationFn: async (reward: Reward) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");

      const { error: rewardError } = await supabase
        .from('rewards')
        .update({ status: 'approved' })
        .eq('id', reward.id);

      if (rewardError) throw rewardError;

      if (reward.redeemed_by) {
        await supabase.from('notifications').insert({
          user_id: reward.redeemed_by,
          type: 'reward',
          content: `Sua recompensa "${reward.name}" foi aprovada! 😍`
        });
      }

      return reward;
    },
    onSuccess: () => {
      playNotification();
      queryClient.invalidateQueries({ queryKey: ['rewards', profile?.couple_id] });
      toast.success("Resgate aprovado! ✨");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aprovar recompensa");
    }
  });
}

export function useCompleteReward() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { playSuccess } = useSound();

  return useMutation({
    mutationFn: async (reward: Reward) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");

      const { error: rewardError } = await supabase
        .from('rewards')
        .update({ status: 'completed' })
        .eq('id', reward.id);

      if (rewardError) throw rewardError;

      if (reward.redeemed_by) {
        const { data: existingAch } = await supabase
          .from('achievements')
          .select('id')
          .eq('user_id', reward.redeemed_by)
          .eq('title', 'Recompensado')
          .single();

        if (!existingAch) {
          await supabase.from('achievements').insert({
            user_id: reward.redeemed_by,
            title: 'Recompensado',
            description: 'Primeira recompensa resgatada',
            emoji: '🎁'
          });
          
          setTimeout(() => {
            toast.success(`Parceiro(a) desbloqueou: Recompensado 🎁`);
          }, 500);
        }

        await supabase.from('notifications').insert({
          user_id: reward.redeemed_by,
          type: 'reward',
          content: `A recompensa "${reward.name}" foi entregue! Aproveite! ❤️`
        });
      }

      return reward;
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['rewards', profile?.couple_id] });
      toast.success("Recompensa entregue e concluída! ❤️");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao concluir recompensa");
    }
  });
}

export function useRejectReward() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { playNotification } = useSound();

  return useMutation({
    mutationFn: async (reward: Reward) => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");
      if (!reward.redeemed_by) throw new Error("Não foi possível identificar quem resgatou");

      const { error: rewardError } = await supabase
        .from('rewards')
        .update({ status: 'rejected' })
        .eq('id', reward.id);

      if (rewardError) throw rewardError;

      const { data: partnerProfile, error: partnerError } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', reward.redeemed_by)
        .single();

      if (partnerError) throw partnerError;

      const refundedXp = partnerProfile.xp + reward.cost;
      const { error: refundError } = await supabase
        .from('profiles')
        .update({ xp: refundedXp })
        .eq('id', reward.redeemed_by);

      if (refundError) throw refundError;

      await supabase.from('notifications').insert({
        user_id: reward.redeemed_by,
        type: 'system',
        content: `Seu pedido de "${reward.name}" foi rejeitado e seu XP devolvido. 🔄`
      });

      return reward;
    },
    onSuccess: () => {
      playNotification();
      queryClient.invalidateQueries({ queryKey: ['rewards', profile?.couple_id] });
      toast.info("Resgate rejeitado. XP devolvido.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao rejeitar recompensa");
    }
  });
}
