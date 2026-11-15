# 🌦️ Hava Panosu

[![Testler](https://github.com/sumeyyeealtintas/hava-panosu/actions/workflows/test.yml/badge.svg)](https://github.com/sumeyyeealtintas/hava-panosu/actions/workflows/test.yml)

Şehir arayıp **anlık hava durumunu ve 7 günlük tahmini** gösteren, telefona **uygulama gibi kurulabilen (PWA)** mobil uyumlu bir web uygulaması. Framework ve derleme adımı yok: saf HTML, CSS ve JavaScript (ES modülleri).

## 🧰 Teknolojiler
HTML5 · CSS3 (değişkenler, grid, koyu tema) · JavaScript (ES modülleri, `fetch`, `async/await`) · Service Worker · Web App Manifest · Node.js test runner · [Open-Meteo API](https://open-meteo.com)

## ✨ Özellikler
- 🔍 Şehir arama (birden fazla eşleşmede seçim listesi) ve **📍 konumumu kullan**
- 🌡️ Anlık sıcaklık, hissedilen, nem, rüzgâr hızı ve yönü; sıcaklığa göre renk kodlaması
- 📅 7 günlük tahmin: en yüksek / en düşük sıcaklık, yağış olasılığı, **Türkçe gün adları**
- 📱 **Mobil öncelikli** tasarım, 44 px üstü dokunma hedefleri, telefona "Ana ekrana ekle" ile kurulabilir
- 🌗 **Koyu / açık tema** sistem ayarından otomatik gelir (`prefers-color-scheme`)
- 📴 **Çevrimdışı destek:** uygulama kabuğu Service Worker ile önbelleğe alınır; ağ yoksa son başarılı hava verisi "çevrimdışı" uyarısıyla gösterilir
- ♿ **Erişilebilirlik:** ekran okuyucu için `aria-live` durum mesajları, "içeriğe geç" bağlantısı, görünür odak halkası, `prefers-reduced-motion` desteği
- 🔒 **Güvenli DOM:** API'den gelen tüm metinler `textContent` ile yazılır, `innerHTML` kullanılmaz (XSS'e karşı)
- 💾 Son seçilen şehir hatırlanır (`localStorage` kapalıysa uygulama yine çalışır)

## 🚀 Çalıştırma
Derleme gerekmez, bir statik sunucu yeterlidir (Service Worker `file://` ile çalışmaz):
```bash
python -m http.server 8080
```
`http://localhost:8080` adresini aç.

**Test:**
```bash
node --test        # 12 test (Node.js 20+)
```

## 🌐 Yayınlama (GitHub Pages)
Repo ayarlarında **Settings → Pages → Branch: `main` / `(root)`** seçmen yeterlidir. Adres: `https://<kullanici>.github.io/hava-panosu/`

## 🏗️ Mimari
```
├── index.html            # sayfa iskeleti
├── css/stil.css          # mobil öncelikli stil, tema değişkenleri
├── js/
│   ├── mantik.js         # SAF fonksiyonlar (hava kodu çevirisi, URL üretimi, veri çözümleme)
│   └── uygulama.js       # DOM, ağ ve durum yönetimi
├── sw.js                 # Service Worker (uygulama kabuğu önbelleği)
├── manifest.webmanifest  # kurulabilirlik
├── icons/
└── tests/mantik.test.js
```
**Neden ikiye bölündü?** Mantık (`mantik.js`) DOM ve ağdan bağımsız olduğu için Node ile saniyeler içinde test edilir; arayüz kodu (`uygulama.js`) yalnızca bu fonksiyonları kullanır.

## 🧪 Neler test edilir?
WMO hava kodlarının Türkçe çevirisi ve bilinmeyen kod, rüzgâr yönünün derece→yön dönüşümü (negatif ve 360 üstü değerler dahil), sıcaklık sınıfı sınırları, Türkçe gün adları, arama URL'sinin özel karakterlerle güvenli kodlanması, API cevabının çözümlenmesi ve bozuk cevapta anlaşılır hata.

## ⚠️ Doğrulama Notu
Uygulama yerel sunucuda gerçek veriyle çalıştırılıp denendi: telefon boyutunda görünüm, şehir arama ve seçim, hata mesajı. **Service Worker kaydı ve çevrimdışı mod, geliştirme ortamındaki gömülü tarayıcı Service Worker desteklemediği için burada denenemedi**; önbelleğe alınan her dosyanın var olduğu ve `sw.js`'in sözdiziminin geçerli olduğu doğrulandı. Gerçek bir tarayıcıda (Chrome/Edge) deneyip DevTools → Application sekmesinden kontrol etmek gerekir.

## 🔭 Geliştirme Fikirleri
- Saatlik tahmin grafiği
- Birim seçimi (°C / °F) ve favori şehir listesi
- Hava durumuna göre dinamik arka plan
- Playwright ile uçtan uca tarayıcı testi

*Veri: [Open-Meteo.com](https://open-meteo.com/), CC BY 4.0.*
