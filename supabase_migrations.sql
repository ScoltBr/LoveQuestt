-- ============================================================
-- 1. TABELA DE PREFERÊNCIAS DO USUÁRIO
-- Persiste toggles de notificação e comportamentos do app
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id         UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  notif_pending   BOOLEAN DEFAULT TRUE,
  notif_partner   BOOLEAN DEFAULT TRUE,
  notif_reward    BOOLEAN DEFAULT TRUE,
  notif_goal      BOOLEAN DEFAULT FALSE,
  notif_streak    BOOLEAN DEFAULT TRUE,
  reward_approval BOOLEAN DEFAULT TRUE,
  reward_cancel   BOOLEAN DEFAULT FALSE,
  reward_history  BOOLEAN DEFAULT TRUE,
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia próprias preferências" ON public.user_preferences;
CREATE POLICY "Usuário gerencia próprias preferências"
ON public.user_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. CAMPO is_admin NA TABELA PROFILES
-- Para o AdminGuard do Admin.tsx e políticas
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 3. TABELA DE FEEDBACK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário insere próprio feedback" ON public.feedback;
CREATE POLICY "Usuário insere próprio feedback"
ON public.feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin lê feedbacks" ON public.feedback;
CREATE POLICY "Admin lê feedbacks"
ON public.feedback FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Para marcar alguém como admin (substitua o UUID):
-- UPDATE public.profiles SET is_admin = TRUE WHERE id = 'UUID_DO_USUARIO';

-- ============================================================
-- 4. PITY SYSTEM NO GACHA
-- Adiciona contadores de pity na tabela gacha_weekly_logs
-- e uma RPC para verificar e forçar prêmio raro após X pulls
-- ============================================================

-- 4a. Adicionar campo pity_count à tabela de logs existente (se já existir)
ALTER TABLE public.gacha_loot_pool
  ADD COLUMN IF NOT EXISTS min_pity_count INT DEFAULT NULL;
-- min_pity_count: se definido, o item é garantido após esse número de pulls sem rarity >= 'incomum'

-- 4b. Adicionar tabela de controle de pity por casal
CREATE TABLE IF NOT EXISTS public.gacha_pity (
  couple_id          UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  pulls_since_rare   INT DEFAULT 0,  -- Pulls sem incomum ou lendário
  pulls_since_legen  INT DEFAULT 0,  -- Pulls sem lendário
  updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.gacha_pity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Casal vê e edita próprio pity" ON public.gacha_pity;
CREATE POLICY "Casal vê e edita próprio pity"
ON public.gacha_pity FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE couple_id = gacha_pity.couple_id
  )
);

-- ============================================================
-- 5. Atualizar RPC do Gacha para incluir pity
-- Chame a função open_gacha_with_pity em vez de abrir via cliente
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_update_pity(
  p_couple_id UUID,
  p_rarity    TEXT  -- 'comum', 'incomum', 'lendario'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.gacha_pity (couple_id, pulls_since_rare, pulls_since_legen)
  VALUES (p_couple_id, 0, 0)
  ON CONFLICT (couple_id) DO NOTHING;

  IF p_rarity = 'lendario' THEN
    UPDATE public.gacha_pity
    SET pulls_since_rare = 0, pulls_since_legen = 0, updated_at = NOW()
    WHERE couple_id = p_couple_id;
  ELSIF p_rarity = 'incomum' THEN
    UPDATE public.gacha_pity
    SET pulls_since_rare = 0, pulls_since_legen = pulls_since_legen + 1, updated_at = NOW()
    WHERE couple_id = p_couple_id;
  ELSE
    UPDATE public.gacha_pity
    SET pulls_since_rare = pulls_since_rare + 1, pulls_since_legen = pulls_since_legen + 1, updated_at = NOW()
    WHERE couple_id = p_couple_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_update_pity(UUID, TEXT) TO authenticated;
