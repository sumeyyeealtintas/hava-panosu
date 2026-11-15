// Service Worker: uygulama kabuğunu (HTML/CSS/JS) önbelleğe alır, böylece çevrimdışıyken de açılır.
// Hava verisi (API) önbelleğe ALINMAZ: eski veriyi "güncel" gibi göstermemek için uygulama kendi
// son-veri yedeğini localStorage'da tutar ve "çevrimdışı" uyarısıyla gösterir.
const SURUM = 'hava-panosu-v1';
const KABUK = [
  './', 'index.html', 'css/stil.css', 'js/uygulama.js', 'js/mantik.js',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (olay) => {
  olay.waitUntil(caches.open(SURUM).then((c) => c.addAll(KABUK)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (olay) => {
  olay.waitUntil(
    caches.keys()
      .then((anahtarlar) => Promise.all(anahtarlar.filter((a) => a !== SURUM).map((a) => caches.delete(a))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (olay) => {
  const istek = olay.request;
  const url = new URL(istek.url);
  if (istek.method !== 'GET' || url.origin !== self.location.origin) return;   // API çağrılarına dokunma

  // Önce ağ, olmazsa önbellek (geliştirirken güncel dosyayı görmek için); başarılı cevabı önbelleğe yaz
  olay.respondWith(
    fetch(istek)
      .then((cevap) => {
        const kopya = cevap.clone();
        caches.open(SURUM).then((c) => c.put(istek, kopya));
        return cevap;
      })
      .catch(() => caches.match(istek).then((k) => k || caches.match('index.html'))),
  );
});
