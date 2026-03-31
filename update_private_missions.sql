-- ==========================================
-- PASSO 1: Execute apenas este bloco primeiro
-- ==========================================

-- Adiciona o campo couple_id para compartilhamento de missões de casal
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS couple_id UUID REFERENCES public.couples(id);

-- Atualiza a restrição 'habits_type_check' para permitir o tipo 'privada'
ALTER TABLE public.habits DROP CONSTRAINT IF EXISTS habits_type_check;
ALTER TABLE public.habits ADD CONSTRAINT habits_type_check CHECK (type IN ('individual', 'casal', 'privada'));

-- ==========================================
-- PASSO 2: Após o passo 1 concluir com sucesso, 
-- execute apenas este bloco final
-- ==========================================

-- Atualiza as missões antigas para que elas não sumam para os parceiros
UPDATE public.habits
SET couple_id = profiles.couple_id
FROM public.profiles
WHERE habits.user_id = profiles.id
  AND profiles.couple_id IS NOT NULL
  AND habits.couple_id IS NULL;
