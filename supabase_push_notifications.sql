-- ============================================================
-- SISTEMA DE PUSH NOTIFICATIONS - LoveQuest
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- 1. TABELA DE INSCRIÇÕES PUSH (Push Subscriptions)
-- Armazena as chaves criptografadas de cada dispositivo do usuário
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,         -- Para saber se é Android, iOS, etc.
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário gerencia próprias inscrições push"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Edge Function pode ler as subscriptions de qualquer usuário (para envio server-side)
-- Isso é controlado pelo service_role key da Edge Function, não pelo anon key.

-- ============================================================
-- 2. LOG DE NOTIFICAÇÕES ENVIADAS
-- Controla frequência (anti-spam) e rastreia entregas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.push_notification_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,  -- 'reward_redeemed', 'daily_reminder', 'streak_alert', etc.
  sent_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered     BOOLEAN DEFAULT NULL,  -- NULL = pending, true = delivered, false = failed
  error_msg     TEXT,
  payload       JSONB  -- Snapshot do payload enviado
);

ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas seus próprios logs
CREATE POLICY "Usuário vê próprios logs de push"
ON public.push_notification_logs FOR SELECT
USING (auth.uid() = user_id);

-- Apenas a Edge Function (service_role) pode inserir logs
-- (sem policy de INSERT = apenas service_role pode inserir)

-- ============================================================
-- 3. ADICIONAR CAMPO DE CONFIGURAÇÃO PUSH EM user_preferences
-- Permite ao usuário ligar/desligar push notifications
-- ============================================================
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_daily_reminder BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_daily_hour INT DEFAULT 22;  -- Hora (0-23) para lembrete

-- ============================================================
-- 4. CAMPO last_interaction_at NOS PROFILES
-- Usado pela regra inteligente para não spamear usuários ativos
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger para atualizar last_interaction_at em ações comuns:
-- (Você pode adaptar para atualizar via RPC nos eventos de missão/recompensa também)
CREATE OR REPLACE FUNCTION public.update_last_interaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET last_interaction_at = NOW()
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. FUNÇÃO AUXILIAR: Verificar cooldown de notificação
-- Retorna TRUE se pode enviar, FALSE se está em cooldown
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_send_push(
  p_user_id UUID,
  p_type    TEXT,
  p_hours   INT DEFAULT 20  -- Cooldown em horas
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_last_sent TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT sent_at INTO v_last_sent
  FROM public.push_notification_logs
  WHERE user_id = p_user_id AND type = p_type
  ORDER BY sent_at DESC
  LIMIT 1;

  IF v_last_sent IS NULL THEN
    RETURN TRUE;  -- Nunca enviou, pode enviar
  END IF;

  RETURN (NOW() - v_last_sent) > (p_hours || ' hours')::INTERVAL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_send_push(UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_send_push(UUID, TEXT, INT) TO service_role;

-- ============================================================
-- 6. CRON JOB DIÁRIO (opcional, requer extensão pg_cron)
-- Ative no Dashboard: Extensions > pg_cron
-- Ajuste o horário conforme desejado (22:00 BRT = 01:00 UTC)
-- ============================================================
-- Descomente e execute DEPOIS de ativar pg_cron:

-- SELECT cron.schedule(
--   'daily-push-22h',
--   '0 1 * * *',   -- 01:00 UTC = 22:00 BRT
--   $$
--     SELECT net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/send-push',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := '{"type":"daily_reminder"}'::jsonb
--     );
--   $$
-- );

-- ============================================================
-- Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_logs_user_type_sent ON public.push_notification_logs(user_id, type, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_interaction ON public.profiles(last_interaction_at);
