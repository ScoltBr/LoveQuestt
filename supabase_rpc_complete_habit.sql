-- ============================================================
-- RPC: complete_habit_v2
-- Executa de forma atômica:
--   1. Insere a completion
--   2. Calcula e atualiza streak
--   3. Atualiza XP do perfil
--   4. Verifica e desbloqueia conquistas
--   5. Notifica o parceiro
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_habit_v2(
  p_habit_id  UUID,
  p_user_id   UUID,
  p_date      DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_habit           RECORD;
  v_profile         RECORD;
  v_completion_id   UUID;
  v_xp_to_earn      INT := 0;
  v_new_xp          INT;
  v_new_streak      INT;
  v_last_date       DATE;
  v_diff_days       INT;
  v_today_count     INT;
  v_total_count     INT;
  v_couple          RECORD;
  v_partner_id      UUID;
  v_ach_titles      TEXT[];
  v_new_achievements JSONB[] := ARRAY[]::JSONB[];
  v_result          JSON;
BEGIN
  -- ── 0. Validar autenticação ────────────────────────────────────────────────
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- ── 1. Buscar hábito ──────────────────────────────────────────────────────
  SELECT * INTO v_habit FROM public.habits
  WHERE id = p_habit_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit not found or inactive';
  END IF;

  -- ── 2. Verificar duplicata (já completou hoje?) ───────────────────────────
  IF EXISTS (
    SELECT 1 FROM public.habit_completions
    WHERE habit_id = p_habit_id
      AND user_id = p_user_id
      AND completed_at = p_date
  ) THEN
    RAISE EXCEPTION 'Habit already completed today';
  END IF;

  -- ── 3. Buscar perfil ──────────────────────────────────────────────────────
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- ── 4. Calcular XP ────────────────────────────────────────────────────────
  v_xp_to_earn := CASE WHEN v_habit.type = 'privada' THEN 0 ELSE v_habit.xp_value END;

  -- ── 5. Inserir completion ─────────────────────────────────────────────────
  INSERT INTO public.habit_completions (habit_id, user_id, completed_at, xp_earned)
  VALUES (p_habit_id, p_user_id, p_date, v_xp_to_earn)
  RETURNING id INTO v_completion_id;

  -- ── 6. Calcular Streak (atomicamente) ─────────────────────────────────────
  v_new_streak := COALESCE(v_profile.streak, 0);

  SELECT MAX(completed_at) INTO v_last_date
  FROM public.habit_completions
  WHERE user_id = p_user_id
    AND completed_at < p_date;

  IF v_last_date IS NOT NULL THEN
    v_diff_days := p_date - v_last_date;

    IF v_diff_days = 1 THEN
      -- Completou ontem: verifica se é a 1ª missão DO DIA (conta inclui a que acabou de inserir)
      SELECT COUNT(*) INTO v_today_count
      FROM public.habit_completions
      WHERE user_id = p_user_id AND completed_at = p_date;

      IF v_today_count <= 1 THEN
        v_new_streak := v_new_streak + 1;
      END IF;
    ELSIF v_diff_days > 1 THEN
      -- Quebrou a sequência
      v_new_streak := 1;
    END IF;
    -- diff = 0 é impossível (bloqueado no passo 2)
  ELSE
    -- Primeira missão da história
    v_new_streak := 1;
  END IF;

  -- ── 7. Atualizar XP e Streak ──────────────────────────────────────────────
  v_new_xp := COALESCE(v_profile.xp, 0) + v_xp_to_earn;

  UPDATE public.profiles
  SET xp = v_new_xp, streak = v_new_streak
  WHERE id = p_user_id;

  -- ── 8. Verificar conquistas ───────────────────────────────────────────────
  SELECT ARRAY_AGG(title) INTO v_ach_titles
  FROM public.achievements WHERE user_id = p_user_id;
  v_ach_titles := COALESCE(v_ach_titles, ARRAY[]::TEXT[]);

  SELECT COUNT(*) INTO v_total_count
  FROM public.habit_completions WHERE user_id = p_user_id;

  -- Helper inline para checar + inserir conquista
  -- "Primeira Missão"
  IF NOT ('Primeira Missão' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Primeira Missão', 'Você completou sua primeira missão!', '⭐');
    v_new_achievements := v_new_achievements || '{"title":"Primeira Missão","emoji":"⭐"}'::JSONB;
  END IF;

  -- "Casal em Ação"
  IF v_habit.type = 'casal' AND NOT ('Casal em Ação' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Casal em Ação', 'Primeira missão em casal', '💑');
    v_new_achievements := v_new_achievements || '{"title":"Casal em Ação","emoji":"💑"}'::JSONB;
  END IF;

  -- "Dedicação" (50 missões)
  IF v_total_count >= 50 AND NOT ('Dedicação' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Dedicação', '50 missões completadas', '🏆');
    v_new_achievements := v_new_achievements || '{"title":"Dedicação","emoji":"🏆"}'::JSONB;
  END IF;

  -- "Centurião" (100 XP)
  IF v_new_xp >= 100 AND NOT ('Centurião' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Centurião', 'Ganhe 100 XP', '💯');
    v_new_achievements := v_new_achievements || '{"title":"Centurião","emoji":"💯"}'::JSONB;
  END IF;

  -- "Lendário" (700 XP)
  IF v_new_xp >= 700 AND NOT ('Lendário' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Lendário', 'Alcance o nível 7 (700 XP)', '👑');
    v_new_achievements := v_new_achievements || '{"title":"Lendário","emoji":"👑"}'::JSONB;
  END IF;

  -- "Sequência de 7"
  IF v_new_streak >= 7 AND NOT ('Sequência de 7' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Sequência de 7', '7 dias seguidos de missões', '🔥');
    v_new_achievements := v_new_achievements || '{"title":"Sequência de 7","emoji":"🔥"}'::JSONB;
  END IF;

  -- "Maratonista"
  IF v_new_streak >= 30 AND NOT ('Maratonista' = ANY(v_ach_titles)) THEN
    INSERT INTO public.achievements (user_id, title, description, emoji)
    VALUES (p_user_id, 'Maratonista', '30 dias seguidos de missões', '🏅');
    v_new_achievements := v_new_achievements || '{"title":"Maratonista","emoji":"🏅"}'::JSONB;
  END IF;

  -- ── 9. Notificar parceiro ─────────────────────────────────────────────────
  IF v_habit.type <> 'privada' AND v_habit.couple_id IS NOT NULL THEN
    SELECT
      CASE WHEN partner1_id = p_user_id THEN partner2_id ELSE partner1_id END
    INTO v_partner_id
    FROM public.couples WHERE id = v_habit.couple_id;

    IF v_partner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, content)
      VALUES (
        v_partner_id,
        'mission',
        v_profile.name || ' completou a missão: ' || v_habit.name || '! 🎯'
      );
    END IF;
  END IF;

  -- ── 10. Retornar resultado ────────────────────────────────────────────────
  v_result := json_build_object(
    'completion_id',     v_completion_id,
    'xp_earned',         v_xp_to_earn,
    'new_xp',            v_new_xp,
    'new_streak',        v_new_streak,
    'new_achievements',  v_new_achievements
  );

  RETURN v_result;
END;
$$;

-- Permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.complete_habit_v2(UUID, UUID, DATE) TO authenticated;


-- ============================================================
-- RPC: uncomplete_habit_v2
-- Desfaz completion atomicamente:
--   1. Remove a completion
--   2. Recalcula streak
--   3. Subtrai XP
-- ============================================================
CREATE OR REPLACE FUNCTION public.uncomplete_habit_v2(
  p_habit_id UUID,
  p_user_id  UUID,
  p_date     DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile       RECORD;
  v_completion    RECORD;
  v_remaining     INT;
  v_new_xp        INT;
  v_new_streak    INT;
BEGIN
  -- Validar autenticação
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Buscar a completion
  SELECT * INTO v_completion
  FROM public.habit_completions
  WHERE habit_id = p_habit_id AND user_id = p_user_id AND completed_at = p_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Completion not found';
  END IF;

  -- Buscar perfil
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  -- Deletar a completion
  DELETE FROM public.habit_completions WHERE id = v_completion.id;

  -- Verificar se ainda existem completions hoje
  SELECT COUNT(*) INTO v_remaining
  FROM public.habit_completions
  WHERE user_id = p_user_id AND completed_at = p_date;

  v_new_streak := COALESCE(v_profile.streak, 0);
  IF v_remaining = 0 AND v_new_streak > 0 THEN
    v_new_streak := v_new_streak - 1;
  END IF;

  v_new_xp := GREATEST(0, COALESCE(v_profile.xp, 0) - COALESCE(v_completion.xp_earned, 0));

  UPDATE public.profiles
  SET xp = v_new_xp, streak = v_new_streak
  WHERE id = p_user_id;

  RETURN json_build_object(
    'xp_subtracted', COALESCE(v_completion.xp_earned, 0),
    'new_xp',        v_new_xp,
    'new_streak',    v_new_streak
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.uncomplete_habit_v2(UUID, UUID, DATE) TO authenticated;