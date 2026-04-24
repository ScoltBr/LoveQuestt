// @ts-ignore: O VS Code pode não reconhecer jsr: sem a extensão do Deno configurada globalmente
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Declaração para satisfazer o TypeScript do VS Code (já que o Deno não está globalmente tipado aqui)
declare const Deno: any;

// ─── Tipos ─────────────────────────────────────────────────────────────────
interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface NotificationPayload {
  type: "reward_redeemed" | "daily_reminder" | "streak_alert" | "test";
  title?: string;
  body?: string;
  icon?: string;
  url?: string;
  badge?: string;
  // Para reward_redeemed
  target_user_id?: string; // Usuário que vai RECEBER a notif
  reward_name?: string;
  reward_emoji?: string;
}

// ─── Constantes de VAPID (serão substituídas pelos Secrets do Supabase) ────
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:oi@lovequest.app";

// ─── Gerador de JWT VAPID (sem biblioteca externa) ─────────────────────────
async function generateVapidJWT(audience: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: VAPID_SUBJECT,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

  const unsignedToken = `${encode(header)}.${encode(payload)}`;

  // Importar chave privada VAPID (formato base64url raw)
  const privateKeyBytes = base64urlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await (crypto.subtle as any).importKey(
    "raw",
    privateKeyBytes,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await (crypto.subtle as any).sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${unsignedToken}.${signatureBase64}`;
}

function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  return new Uint8Array(binary.split("").map((c) => c.charCodeAt(0)));
}

// ─── Enviar push para uma inscrição específica ──────────────────────────────
async function sendPushToSubscription(
  subscription: PushSubscription,
  notifPayload: object
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;

    const jwt = await generateVapidJWT(audience);
    const vapidHeader = `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`;

    // Montar o body da notificação
    const payloadStr = JSON.stringify(notifPayload);
    const payloadBytes = new TextEncoder().encode(payloadStr);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidHeader,
        "Content-Type": "application/octet-stream",
        "Content-Length": String(payloadBytes.byteLength),
        TTL: "86400",
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── Buscar e enviar para todos os dispositivos de um usuário ───────────────
async function sendPushToUser(
  supabase: any,
  userId: string,
  notifType: string,
  notifPayload: object,
  skipCooldownCheck = false
): Promise<void> {
  // 1. Verificar se o usuário ativou push notifications
  const { data: prefsData } = await supabase
    .from("user_preferences")
    .select("push_enabled, notif_reward, notif_streak, push_daily_reminder")
    .eq("user_id", userId)
    .maybeSingle();
    
  const prefs: any = prefsData;

  if (prefs && !prefs.push_enabled) {
    console.log(`[push] User ${userId} has push disabled`);
    return;
  }

  // 2. Verificar tipo específico de notificação
  if (notifType === "reward_redeemed" && prefs && !prefs.notif_reward) return;
  if (notifType === "streak_alert" && prefs && !prefs.notif_streak) return;
  if (notifType === "daily_reminder" && prefs && !prefs.push_daily_reminder) return;

  // 3. Verificar cooldown via função SQL (exceto para reward_redeemed = sempre enviar)
  if (!skipCooldownCheck && notifType !== "reward_redeemed") {
    const { data: canSendData } = await (supabase as any)
      .rpc("can_send_push", {
        p_user_id: userId,
        p_type: notifType,
        p_hours: 20,
      });
      
    const canSend: any = canSendData;

    if (!canSend) {
      console.log(`[push] User ${userId} in cooldown for ${notifType}`);
      return;
    }
  }

  // 4. Verificar interação recente para daily_reminder (não enviar se ativo recentemente)
  if (notifType === "daily_reminder") {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("last_interaction_at")
      .eq("id", userId)
      .maybeSingle();
      
    const profile: any = profileData;

    if (profile?.last_interaction_at) {
      const lastInteraction = new Date(profile.last_interaction_at);
      const hoursSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 6) {
        console.log(`[push] User ${userId} interacted recently (${hoursSince.toFixed(1)}h ago), skipping reminder`);
        return;
      }
    }
  }

  // 5. Buscar todas as inscrições do usuário
  const { data: subsData } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
    
  const subscriptions: any[] = subsData as any;

  if (!subscriptions || subscriptions.length === 0) {
    console.log(`[push] No subscriptions for user ${userId}`);
    return;
  }

  // 6. Enviar para todos os dispositivos
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendPushToSubscription(sub, notifPayload)
    )
  );

  const anySuccess = results.some(
    (r) => r.status === "fulfilled" && r.value.success
  );

  // 7. Registrar no log
  await supabase.from("push_notification_logs").insert({
    user_id: userId,
    type: notifType,
    delivered: anySuccess,
    error_msg: results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => (r as PromiseFulfilledResult<{ success: boolean; error?: string }>).value.error)
      .join("; ") || null,
    payload: notifPayload,
  } as any);
}

// ─── Handler Principal ──────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json() as NotificationPayload;
    const { type } = body;

    console.log(`[push] Received request: type=${type}`);

    if (type === "reward_redeemed") {
      // ── Notificação imediata para o parceiro quando resgate é solicitado ──
      const { target_user_id, reward_name, reward_emoji } = body;
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await sendPushToUser(
        supabase,
        target_user_id,
        "reward_redeemed",
        {
          title: `${reward_emoji || "🎁"} Resgate solicitado!`,
          body: `Seu parceiro quer resgatar: ${reward_name}. Toque para aprovar ou rejeitar.`,
          icon: "/icon.png",
          badge: "/icon.png",
          url: "/app/recompensas",
          tag: "reward-redeemed",
        },
        true // skip cooldown check
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "daily_reminder") {
      // ── Lembrete diário para todos os usuários que estão inativos ─────────
      const { data: allSubsData } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .not("user_id", "is", null);
        
      const allSubs: any[] = allSubsData as any;

      const uniqueUsers = [...new Set(allSubs?.map((s) => s.user_id) ?? [])];
      console.log(`[push] Sending daily reminder to ${uniqueUsers.length} users`);

      const messages = [
        { title: "💕 O amor se cultiva todos os dias!", body: "Que tal preencher suas atividades agora? 🌟" },
        { title: "🎯 Hora de evoluir junto!", body: "Seu parceiro está esperando você no LoveQuest ❤️" },
        { title: "🔥 Não quebre sua sequência!", body: "Complete uma missão hoje e mantenha o streak!" },
        { title: "✨ LoveQuest te chama!", body: "Algumas atividades estão esperando por você dois 💑" },
      ];

      const todayMessage = messages[new Date().getDay() % messages.length];

      await Promise.all(
        uniqueUsers.map((userId) =>
          sendPushToUser(supabase, userId, "daily_reminder", {
            ...todayMessage,
            icon: "/icon.png",
            badge: "/icon.png",
            url: "/app",
            tag: "daily-reminder",
          })
        )
      );

      return new Response(JSON.stringify({ ok: true, users: uniqueUsers.length }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "test") {
      // ── Notificação de teste (para debugging) ─────────────────────────────
      // Requer autenticação do usuário via JWT
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }

      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

      await sendPushToUser(
        supabase,
        user.id,
        "test",
        {
          title: "🎉 Funcionou!",
          body: "As notificações push estão ativas no seu dispositivo!",
          icon: "/icon.png",
          badge: "/icon.png",
          url: "/app",
          tag: "test",
        },
        true
      );

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[push] Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
