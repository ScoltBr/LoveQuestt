import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProfile, useCouple } from './useProfile';
import { startOfWeek, format } from 'date-fns';
import { toast } from 'sonner';

export type ChestRarity = 'comum' | 'incomum' | 'lendario';
export type RewardType = 'xp' | 'voucher';

export interface LootItem {
  id: string; // custom id like 'w1'
  name: string;
  type: RewardType;
  value: number | string; // amount of xp, or text of the voucher
  rarity: ChestRarity;
  emoji: string;
  chance: number; // 0 to 100
}

export const CHEST_COSTS = {
  weekly: 0,
  premium: 300,
  legendary: 800
};

// Removemos a constante LOOT_POOLS pois agora ela vive no Banco de Dados!
// Criaremos um novo hook para carregar e exibir esses itens na interface administrativa no futuro.

// Hook para retornar apenas para amostragem/debug, a tabela visual no futuro.
export function useLootPools() {
  return useQuery({
    queryKey: ['lootPools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gacha_loot_pool')
        .select('*');
      
      if (error) throw error;
      return data as LootItem[];
    }
  });
}

// Hook to check if the user/couple already opened the weekly chest
export function useWeeklyGachaStatus() {
  const { session } = useAuth();
  const { data: profile } = useProfile();

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['gachaStatus', profile?.couple_id, weekStart],
    queryFn: async () => {
      if (!profile?.couple_id) return false;

      const { data, error } = await supabase
        .from('gacha_weekly_logs')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .eq('week_start_date', weekStart)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // PG Error 116 means zero rows found on single() which is fine, meaning not opened yet.
        // Wait, maybeSingle doesn't throw 116. Let's just catch actual errors.
        console.error("Error fetching gacha status:", error);
      }

      return !!data; // true = já foi aberto
    },
    enabled: !!session?.user?.id && !!profile?.couple_id,
  });
}

// Function to calculate a random reward based on weights
function rollLoot(pool: LootItem[]): LootItem {
  const roll = Math.random() * 100;
  let cumulative = 0;
  
  for (const item of pool) {
    cumulative += item.chance;
    if (roll <= cumulative) {
      return item;
    }
  }
  // Fallback to the first item (shouldn't happen if chance sum is 100)
  return pool[0];
}

export function useOpenGacha() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const { data: couple } = useCouple(profile?.couple_id || null);

  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  return useMutation({
    mutationFn: async (chestType: 'weekly' | 'premium' | 'legendary') => {
      if (!session?.user?.id || !profile) throw new Error("Não autenticado");

      const cost = CHEST_COSTS[chestType];
      
      // 1. Verificar custo
      if (profile.xp < cost) {
        throw new Error(`Experiência insuficiente! Faltam ${cost - profile.xp} XP.`);
      }

      // 2. Se for o Semanal, verificar se já abriu
      if (chestType === 'weekly') {
        const { count } = await supabase
          .from('gacha_weekly_logs')
          .select('*', { count: 'exact', head: true })
          .eq('couple_id', profile.couple_id)
          .eq('week_start_date', weekStart);

        if (count && count > 0) {
          throw new Error("O Baú Semanal já foi aberto esta semana!");
        }
      }

      // 3. Rolar o Dado para pegar o prêmio diretamente via Banco de Dados
      const { data: dbLootPool, error: poolError } = await supabase
        .from('gacha_loot_pool')
        .select('*')
        .eq('chest_type', chestType);

      if (poolError) throw poolError;
      
      if (!dbLootPool || dbLootPool.length === 0) {
        throw new Error(`O Baú de tipo ${chestType} não contém itens configurados no banco de dados!`);
      }

      // Converte o retorno do banco pro formato LootItem
      const formattedPool: LootItem[] = dbLootPool.map(item => ({
         id: item.id,
         name: item.reward_name,
         type: item.reward_type as RewardType,
         value: item.reward_type === 'xp' ? Number(item.reward_value) : item.reward_value,
         rarity: item.rarity as ChestRarity,
         emoji: item.emoji || '🎁',
         chance: Number(item.chance)
      }));

      // PITY SYSTEM LOGIC
      const { data: pityData } = await supabase
        .from('gacha_pity')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .maybeSingle();
      
      const pullsSinceRare = pityData?.pulls_since_rare || 0;
      const pullsSinceLegen = pityData?.pulls_since_legen || 0;

      // Force pity rule
      let forcedRarity: ChestRarity | null = null;
      if (pullsSinceLegen >= 40) {
        forcedRarity = 'lendario';
      } else if (pullsSinceRare >= 10) {
        forcedRarity = 'incomum';
      }

      // Filter pool if pity triggers
      let filteredPool = formattedPool;
      if (forcedRarity) {
        const pityItems = formattedPool.filter(i => i.rarity === forcedRarity);
        if (pityItems.length > 0) {
           filteredPool = pityItems;
           // redistribute chance to 100 for proper rolling among pity items
           const total = pityItems.reduce((acc, item) => acc + item.chance, 0);
           filteredPool = pityItems.map(item => ({ ...item, chance: (item.chance / total) * 100 }));
        }
      }

      const reward = rollLoot(filteredPool);

      // Atualiza o contador de pity no banco
      await supabase.rpc('check_and_update_pity', {
        p_couple_id: profile.couple_id,
        p_rarity: reward.rarity
      });

      // 4. Se for XP, aplica o balanço (Soma o Prêmio e Desconta o Custo)
      let newXp = profile.xp;
      
      if (reward.type === 'xp') {
        newXp = (profile.xp - cost) + (reward.value as number);
      } else {
        // Se for um VOUCHER, a gente só desconta o custo
        newXp = profile.xp - cost;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 5. Se for Voucher, cria na tabela de recompensas a favor de quem tirou, sem custar nada no futuro
      if (reward.type === 'voucher') {
        await supabase.from('rewards').insert({
           name: `[Gacha] ${reward.value as string}`,
           cost: 0,
           emoji: reward.emoji,
           couple_id: profile.couple_id,
           created_by: couple?.partner1_id === session.user.id ? couple?.partner2_id : couple?.partner1_id, // Atribui a autoria imaginária pro parceiro para que ELE resgate do "sistema" sem dever pra ninguém, mas na vdd o reward vai pro casal resgatar. Mágica fofa:
           status: 'available',
           is_redeemed: false
        });
      }

      // 6. Registrar o log se for weekly
      if (chestType === 'weekly') {
        await supabase.from('gacha_weekly_logs').insert({
          couple_id: profile.couple_id,
          week_start_date: weekStart,
          opened_by_id: session.user.id
        });
      }

      // 7. Notificar parceiro
      const partnerId = couple?.partner1_id === session.user.id ? couple?.partner2_id : couple?.partner1_id;
      if (partnerId) {
        await supabase.from('notifications').insert({
          user_id: partnerId,
          type: 'system',
          content: `${profile.name} abriu o Baú ${chestType.toUpperCase()} e ganhou: ${reward.emoji} ${reward.name}!`
        });
      }

      return { chestType, reward };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['gachaStatus'] });
      
      // O componente chamará o Gacha abrir após isso, os toasts a gente delega pra onde precisar.
    },
    onError: (error: any) => {
      // Toast de erro
      toast.error(error.message || "Não foi possível abrir o baú!");
    }
  });
}

// ===============================================
// ADMIN HOOKS (Para gerenciar a tabela de prêmios)
// ===============================================

export function useAddLoot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Omit<LootItem, 'id'> & { chest_type: string }) => {
      const { data, error } = await supabase
        .from('gacha_loot_pool')
        .insert({
          chest_type: newItem.chest_type,
          reward_name: newItem.name,
          reward_type: newItem.type,
          reward_value: String(newItem.value),
          rarity: newItem.rarity,
          emoji: newItem.emoji,
          chance: newItem.chance
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lootPools'] });
      toast.success("Prêmio adicionado ao Baú!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar prêmio");
    }
  });
}

export function useDeleteLoot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gacha_loot_pool')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lootPools'] });
      toast.success("Prêmio removido do Baú!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover prêmio");
    }
  });
}
