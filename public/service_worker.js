const CACHE_NAME = "bible-reading-challenge-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // 先保持简单：让网页正常走网络
  event.respondWith(fetch(event.request));
});
