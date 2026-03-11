import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Profile {
    id: string;
    name: string;
    avatar_url: string;
    xp: number;
    level: number;
    streak: number;
    couple_id: string | null;
}

export interface Couple {
    id: string;
    partner1_id: string;
    partner2_id: string | null;
    invite_code: string | null;
}

export function useProfile() {
    const { session } = useAuth();

    return useQuery({
        queryKey: ['profile', session?.user?.id],
        queryFn: async () => {
            if (!session?.user?.id) return null;

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
                throw error;
            }

            // Auto-create profile if missing
            if (!profile) {
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: session.user.id,
                        name: session.user.user_metadata?.name || 'Novo Jogador',
                        xp: 0,
                        level: 1,
                        streak: 0,
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                return newProfile as Profile;
            }

            return profile as Profile;
        },
        enabled: !!session?.user?.id,
    });
}

export function useCouple(coupleId: string | null) {
    return useQuery({
        queryKey: ['couple', coupleId],
        queryFn: async () => {
            if (!coupleId) return null;

            const { data, error } = await supabase
                .from('couples')
                .select(`
          *,
          partner1:profiles!couples_partner1_id_fkey(*),
          partner2:profiles!couples_partner2_id_fkey(*)
        `)
                .eq('id', coupleId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!coupleId,
    });
}
