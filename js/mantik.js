// Saf (yan etkisiz) fonksiyonlar: DOM veya ağ kullanmaz, bu yüzden Node ile test edilebilir.

// WMO hava durumu kodları -> Türkçe açıklama ve simge
// Kaynak: Open-Meteo dokümantasyonu (WMO Weather interpretation codes)
const HAVA_KODLARI = {
  0: ['Açık', '☀️'],
  1: ['Çoğunlukla açık', '🌤️'],
  2: ['Parçalı bulutlu', '⛅'],
  3: ['Kapalı', '☁️'],
  45: ['Sisli', '🌫️'],
  48: ['Kırağılı sis', '🌫️'],
  51: ['Hafif çiseleme', '🌦️'],
  53: ['Çiseleme', '🌦️'],
  55: ['Yoğun çiseleme', '🌦️'],
  56: ['Dondurucu çiseleme', '🌧️'],
  57: ['Yoğun dondurucu çiseleme', '🌧️'],
  61: ['Hafif yağmur', '🌦️'],
  63: ['Yağmur', '🌧️'],
  65: ['Kuvvetli yağmur', '🌧️'],
  66: ['Dondurucu yağmur', '🌧️'],
  67: ['Kuvvetli dondurucu yağmur', '🌧️'],
  71: ['Hafif kar', '🌨️'],
  73: ['Kar yağışı', '🌨️'],
  75: ['Yoğun kar yağışı', '❄️'],
  77: ['Kar taneleri', '❄️'],
  80: ['Hafif sağanak', '🌦️'],
  81: ['Sağanak', '🌧️'],
  82: ['Şiddetli sağanak', '⛈️'],
  85: ['Hafif kar sağanağı', '🌨️'],
  86: ['Yoğun kar sağanağı', '❄️'],
  95: ['Gök gürültülü fırtına', '⛈️'],
  96: ['Hafif dolulu fırtına', '⛈️'],
  99: ['Şiddetli dolulu fırtına', '⛈️'],
};

export function havaDurumu(kod) {
  const kayit = HAVA_KODLARI[kod];
  return kayit ? { aciklama: kayit[0], simge: kayit[1] } : { aciklama: 'Bilinmiyor', simge: '❔' };
}

const YONLER = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];

/** Rüzgâr yönünü dereceden (0-360) 8 ana yöne çevirir. Negatif ve 360 üstü değerler döngüsel işlenir. */
export function yonAdi(derece) {
  if (!Number.isFinite(derece)) return '—';
  const normal = ((derece % 360) + 360) % 360;
  return YONLER[Math.round(normal / 45) % 8];
}

/** Sıcaklığa göre CSS sınıfı (renk kodlaması için). */
export function sicaklikSinifi(derece) {
  if (!Number.isFinite(derece)) return 'sicak-bilinmiyor';
  if (derece <= 0) return 'sicak-dondurucu';
  if (derece < 10) return 'sicak-soguk';
  if (derece < 20) return 'sicak-ilik';
  if (derece < 30) return 'sicak-sicak';
  return 'sicak-cok-sicak';
}

export function dereceMetni(sayi) {
  return Number.isFinite(sayi) ? `${Math.round(sayi)}°` : '—';
}

/** "2025-10-10" -> "Cuma" (yerel saat dilimi kayması olmadan: tarihi UTC öğlen olarak ayrıştırır). */
export function gunAdi(tarihMetni, bugunMetni) {
  if (tarihMetni === bugunMetni) return 'Bugün';
  const d = new Date(`${tarihMetni}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return '—';
  const ad = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', timeZone: 'UTC' }).format(d);
  return ad.charAt(0).toLocaleUpperCase('tr-TR') + ad.slice(1);
}

export function sehirAramaURL(ad) {
  return `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(ad.trim())}&count=5&language=tr&format=json`;
}

export function tahminURL(enlem, boylam) {
  const p = new URLSearchParams({
    latitude: String(enlem),
    longitude: String(boylam),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

/** API cevabını arayüzün kullanacağı sade bir nesneye çevirir. Beklenmeyen biçimde anlaşılır hata fırlatır. */
export function tahminiCozumle(veri) {
  if (!veri || !veri.current || !veri.daily || !Array.isArray(veri.daily.time)) {
    throw new Error('Hava durumu verisi beklenmeyen biçimde geldi');
  }
  const c = veri.current;
  const d = veri.daily;
  return {
    simdi: {
      sicaklik: c.temperature_2m,
      hissedilen: c.apparent_temperature,
      nem: c.relative_humidity_2m,
      ruzgar: c.wind_speed_10m,
      ruzgarYonu: c.wind_direction_10m,
      kod: c.weather_code,
      tarih: String(c.time || '').slice(0, 10),
    },
    gunler: d.time.map((tarih, i) => ({
      tarih,
      kod: d.weather_code[i],
      enYuksek: d.temperature_2m_max[i],
      enDusuk: d.temperature_2m_min[i],
      yagisOlasiligi: d.precipitation_probability_max ? d.precipitation_probability_max[i] : null,
    })),
  };
}

/** Şehir sonuçlarını "Konya, Konya, Türkiye" gibi okunur etikete çevirir. */
export function yerEtiketi(y) {
  return [y.name, y.admin1, y.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', ');
}
