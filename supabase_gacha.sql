-- Script SQL para criar as tabelas do Sistema de Gacha
-- Rode esse script no SQL Editor do seu projeto Supabase

-- 1. Tabela para rastrear o uso do Baú Semanal (para evitar giros infinitos na mesma semana)
CREATE TABLE IF NOT EXISTS public.gacha_weekly_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
    opened_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para facilitar a busca por casal e por semana
CREATE UNIQUE INDEX IF NOT EXISTS gacha_weekly_logs_unique_idx ON public.gacha_weekly_logs (couple_id, week_start_date);

-- Opcional: RLS Policies (Row Level Security)
ALTER TABLE public.gacha_weekly_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem logs do seu próprio casal" ON public.gacha_weekly_logs;
CREATE POLICY "Usuários veem logs do seu próprio casal"
ON public.gacha_weekly_logs FOR SELECT
USING ( auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = gacha_weekly_logs.couple_id
));

DROP POLICY IF EXISTS "Usuários inserem logs para seu próprio casal" ON public.gacha_weekly_logs;
CREATE POLICY "Usuários inserem logs para seu próprio casal"
ON public.gacha_weekly_logs FOR INSERT
WITH CHECK ( auth.uid() = opened_by_id );


-- ==========================================
-- 2. TABELA DE PRÊMIOS (POOL DE GACHA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.gacha_loot_pool (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chest_type TEXT NOT NULL, -- 'weekly', 'premium', 'legendary'
    reward_type TEXT NOT NULL, -- 'xp', 'voucher'
    reward_value TEXT NOT NULL, -- "500" se for XP, "Vale Massagem" se for voucher
    reward_name TEXT NOT NULL, -- Nome visual do prêmio
    emoji TEXT DEFAULT '🎁',
    chance NUMERIC NOT NULL, -- Porcentagem, ex: 10 para (10%)
    rarity TEXT NOT NULL, -- 'comum', 'incomum', 'lendario'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões básicas para ler prêmios (todos podem ver)
ALTER TABLE public.gacha_loot_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ver os prêmios" ON public.gacha_loot_pool;
CREATE POLICY "Todos podem ver os prêmios"
ON public.gacha_loot_pool FOR SELECT
USING (true);

-- Permissões para inserir/deletar prêmios
DROP POLICY IF EXISTS "Usuários autenticados podem editar prêmios do gacha" ON public.gacha_loot_pool;
CREATE POLICY "Usuários autenticados podem editar prêmios do gacha"
ON public.gacha_loot_pool FOR ALL
USING (auth.uid() IS NOT NULL);

-- ==========================================
-- INSERÇÃO DOS PRÊMIOS INICIAIS (SEED DATA)
-- ==========================================
-- Baú Semanal
INSERT INTO public.gacha_loot_pool (chest_type, reward_name, reward_type, reward_value, rarity, emoji, chance) VALUES
('weekly', 'Sorte Básica', 'xp', '100', 'comum', '✨', 70),
('weekly', 'Pequeno Bônus', 'xp', '300', 'incomum', '💰', 25),
('weekly', 'Benção Semanal', 'xp', '800', 'lendario', '🔥', 5);

-- Baú Premium
INSERT INTO public.gacha_loot_pool (chest_type, reward_name, reward_type, reward_value, rarity, emoji, chance) VALUES
('premium', 'Reembolso e Trocado', 'xp', '400', 'comum', '💰', 60),
('premium', 'Sorte Grande', 'xp', '700', 'incomum', '💎', 30),
('premium', 'Vale Delivery Surpresa', 'voucher', 'Vale um Ifood/Delivery à escolha', 'lendario', '🥡', 10);

-- Baú Lendário
INSERT INTO public.gacha_loot_pool (chest_type, reward_name, reward_type, reward_value, rarity, emoji, chance) VALUES
('legendary', 'XP Maciço', 'xp', '1200', 'comum', '💎', 50),
('legendary', 'Jackpot Absoluto', 'xp', '2500', 'incomum', '👑', 30),
('legendary', 'Desejo Coringa', 'voucher', 'Direito a fazer 1 pedido impagável', 'lendario', '🃏', 20);
