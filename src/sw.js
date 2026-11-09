import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA navigation fallback. Hosting routes such as /share are served from the
// precached app shell and resolved by React Router on the client.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  })
);

// Cache product images for offline browsing. The list is intentionally
// bounded so a large family wishlist cannot fill the device storage.
registerRoute(
  ({ request }) =>
    request.destination === 'image' && !request.url.startsWith('data:'),
  new CacheFirst({
    cacheName: 'wishlist-images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 60 * 60 * 24 * 30,
        purgeOnQuotaError: true,
      }),
    ],
  })
);
