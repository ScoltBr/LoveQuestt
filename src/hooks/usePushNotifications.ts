import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// A chave pública VAPID precisa ser definida no .env.local como:
// VITE_VAPID_PUBLIC_KEY=sua_chave_publica
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  isSupported: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

// ─── Conversão de VAPID key para Uint8Array ───────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { session } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY;

  // ── Verifica o estado inicial ──────────────────────────────────────────
  useEffect(() => {
    if (!isSupported) return;

    // Estado atual da permissão
    setPermission(Notification.permission as PushPermissionState);

    // Verifica se já existe uma subscription ativa
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    }).catch(console.error);
  }, [isSupported]);

  // ── Inscrever ─────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!isSupported || !session?.user?.id) return;
    setIsLoading(true);

    try {
      // 1. Solicitar permissão
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result !== 'granted') {
        toast.error('Permissão de notificações negada.', {
          description: 'Você pode ativar nas configurações do seu navegador.',
        });
        setIsLoading(false);
        return;
      }

      // 2. Aguardar o service worker estar pronto
      const registration = await navigator.serviceWorker.ready;

      // 3. Cancelar inscrição antiga se existir (para forçar re-subscrição)
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) await existingSub.unsubscribe();

      // 4. Criar nova inscrição
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();
      const keys = subJson.keys as { p256dh: string; auth: string };

      // 5. Salvar no Supabase
      const { error } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: session.user.id,
          endpoint: subJson.endpoint!,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );

      if (error) throw error;

      // 6. Atualizar preferências do usuário
      await supabase
        .from('user_preferences')
        .upsert(
          { user_id: session.user.id, push_enabled: true },
          { onConflict: 'user_id' }
        );

      setIsSubscribed(true);
      toast.success('🔔 Notificações ativadas!', {
        description: 'Você receberá alertas importantes do LoveQuest.',
      });
    } catch (err) {
      console.error('[push] Subscribe error:', err);
      toast.error('Erro ao ativar notificações.', {
        description: 'Tente novamente ou verifique as permissões do navegador.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, session?.user?.id]);

  // ── Cancelar inscrição ────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !session?.user?.id) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remover endpoint do Supabase
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', session.user.id)
          .eq('endpoint', subscription.endpoint);

        await subscription.unsubscribe();
      }

      // Desativar push nas preferências
      await supabase
        .from('user_preferences')
        .upsert(
          { user_id: session.user.id, push_enabled: false },
          { onConflict: 'user_id' }
        );

      setIsSubscribed(false);
      toast.info('🔕 Notificações desativadas.');
    } catch (err) {
      console.error('[push] Unsubscribe error:', err);
      toast.error('Erro ao desativar notificações.');
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, session?.user?.id]);

  // ── Notificação de teste ───────────────────────────────────────────────
  const sendTestNotification = useCallback(async () => {
    if (!session) return;
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return;

      const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl
        || import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({ type: 'test' }),
      });

      if (!res.ok) throw new Error(await res.text());
      toast.success('📤 Notificação de teste enviada!');
    } catch (err) {
      console.error('[push] Test error:', err);
      toast.error('Erro ao enviar notificação de teste.');
    }
  }, [session]);

  return {
    permission,
    isSubscribed,
    isLoading,
    isSupported,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}

// ─── Helper para disparar push de resgate de recompensa ──────────────────────
export async function triggerRewardPush(params: {
  targetUserId: string;
  rewardName: string;
  rewardEmoji: string;
  accessToken: string;
}) {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${params.accessToken}`,
        'x-invoke-service': 'true', // indica envio server-to-server
      },
      body: JSON.stringify({
        type: 'reward_redeemed',
        target_user_id: params.targetUserId,
        reward_name: params.rewardName,
        reward_emoji: params.rewardEmoji,
      }),
    });
  } catch (err) {
    console.warn('[push] Could not send reward push:', err);
    // Não bloqueamos o fluxo principal se o push falhar
  }
}
