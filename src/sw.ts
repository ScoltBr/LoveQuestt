// ─── Service Worker para Push Notifications ────────────────────────────────
// Este arquivo é servido de /sw.js pelo vite-plugin-pwa (injectManifest mode)
// Ele recebe os eventos push do servidor e exibe as notificações

/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// Precache dos assets gerados pelo Vite (injetado pelo vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Garante que o Service Worker ativo controle imediatamente os clientes
self.skipWaiting();
clientsClaim();

// ─── Evento PUSH ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let data: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
  } = {};

  try {
    data = event.data.json();
  } catch {
    data = { title: 'LoveQuest', body: event.data.text() };
  }

  // NotificationOptions do TypeScript não inclui propriedades específicas do SW
  // como renotify, vibrate e actions. Estendemos localmente para corrigir isso.
  interface SWNotificationOptions extends NotificationOptions {
    renotify?: boolean;
    vibrate?: number | number[];
    actions?: { action: string; title: string; icon?: string }[];
  }

  const options: SWNotificationOptions = {
    body: data.body || 'Toque para abrir o LoveQuest',
    icon: data.icon || '/icon.png',
    badge: data.badge || '/icon.png',
    tag: data.tag || 'lovequest',
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: data.url || '/app' },
    // Vibração: curta-longa-curta (Android)
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: '💕 Abrir' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'LoveQuest', options)
  );
});

// ─── Evento NOTIFICATIONCLICK ─────────────────────────────────────────────────
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/app';

  event.waitUntil(
    (self.clients as Clients).matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o app já está aberto, foca nele e navega para a URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          (client as WindowClient).focus();
          (client as WindowClient).navigate(url);
          return;
        }
      }
      // Caso contrário, abre uma nova janela
      if ((self.clients as Clients).openWindow) {
        return (self.clients as Clients).openWindow(url);
      }
    })
  );
});

// ─── Evento PUSHSUBSCRIPTIONCHANGE ───────────────────────────────────────────
// Quando o push service muda o endpoint (ex: após expiração), re-inscreve
self.addEventListener('pushsubscriptionchange', (event) => {
  const changeEvent = event as Event & {
    oldSubscription: PushSubscription | null;
    newSubscription: PushSubscription | null;
  };

  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: changeEvent.newSubscription?.options?.applicationServerKey
          ?? changeEvent.oldSubscription?.options?.applicationServerKey,
      })
      .then(async (newSub) => {
        // Notificar o servidor da nova subscription
        const subJson = newSub.toJSON();
        await fetch('/api/push-subscription-refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subJson),
        }).catch(console.error);
      })
  );
});
