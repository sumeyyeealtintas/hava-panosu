import test from 'node:test';
import assert from 'node:assert/strict';
import {
  havaDurumu, yonAdi, sicaklikSinifi, dereceMetni, gunAdi,
  sehirAramaURL, tahminURL, tahminiCozumle, yerEtiketi,
} from '../js/mantik.js';

test('bilinen hava kodları Türkçe açıklama döndürür', () => {
  assert.equal(havaDurumu(0).aciklama, 'Açık');
  assert.equal(havaDurumu(63).aciklama, 'Yağmur');
  assert.equal(havaDurumu(95).simge, '⛈️');
});

test('bilinmeyen hava kodu çökmez', () => {
  assert.deepEqual(havaDurumu(12345), { aciklama: 'Bilinmiyor', simge: '❔' });
  assert.deepEqual(havaDurumu(undefined), { aciklama: 'Bilinmiyor', simge: '❔' });
});

test('rüzgâr yönü: ana yönler ve döngüsellik', () => {
  assert.equal(yonAdi(0), 'Kuzey');
  assert.equal(yonAdi(90), 'Doğu');
  assert.equal(yonAdi(180), 'Güney');
  assert.equal(yonAdi(225), 'Güneybatı');
  assert.equal(yonAdi(360), 'Kuzey');      // tam tur
  assert.equal(yonAdi(350), 'Kuzey');      // 360'a yakın değerler kuzeye yuvarlanır
  assert.equal(yonAdi(-90), 'Batı');       // negatif derece
  assert.equal(yonAdi(450), 'Doğu');       // 360'tan büyük
  assert.equal(yonAdi(NaN), '—');
});

test('sıcaklık sınıfı sınır değerleri', () => {
  assert.equal(sicaklikSinifi(-5), 'sicak-dondurucu');
  assert.equal(sicaklikSinifi(0), 'sicak-dondurucu');
  assert.equal(sicaklikSinifi(9.9), 'sicak-soguk');
  assert.equal(sicaklikSinifi(10), 'sicak-ilik');
  assert.equal(sicaklikSinifi(29.9), 'sicak-sicak');
  assert.equal(sicaklikSinifi(30), 'sicak-cok-sicak');
  assert.equal(sicaklikSinifi(null), 'sicak-bilinmiyor');
});

test('derece metni yuvarlar, eksik veride çizgi gösterir', () => {
  assert.equal(dereceMetni(9.6), '10°');
  assert.equal(dereceMetni(-3.6), '-4°');
  assert.equal(dereceMetni(undefined), '—');
});

test('gün adı: bugün, Türkçe gün adı ve geçersiz tarih', () => {
  assert.equal(gunAdi('2025-10-10', '2025-10-10'), 'Bugün');
  assert.equal(gunAdi('2025-10-10', '2025-10-09'), 'Cuma');       // 10 Ekim 2025 Cuma
  assert.equal(gunAdi('2025-10-12', '2025-10-09'), 'Pazar');
  assert.equal(gunAdi('tarih-degil', '2025-10-09'), '—');
});

test('arama URL\'si özel karakterleri güvenli kodlar', () => {
  const u = sehirAramaURL('  İstanbul & Co/?x=1 ');
  assert.ok(u.includes('name=%C4%B0stanbul%20%26%20Co%2F%3Fx%3D1&'));
  assert.ok(!u.includes(' '));
});

test('tahmin URL\'si koordinat ve parametreleri içerir', () => {
  const u = new URL(tahminURL(37.87, 32.48));
  assert.equal(u.searchParams.get('latitude'), '37.87');
  assert.equal(u.searchParams.get('longitude'), '32.48');
  assert.equal(u.searchParams.get('forecast_days'), '7');
  assert.ok(u.searchParams.get('current').includes('temperature_2m'));
});

const ORNEK = {
  current: { time: '2025-10-10T14:00', temperature_2m: 18.4, apparent_temperature: 17, relative_humidity_2m: 45,
             wind_speed_10m: 12.3, wind_direction_10m: 270, weather_code: 2 },
  daily: { time: ['2025-10-10', '2025-10-11'], weather_code: [2, 61], temperature_2m_max: [20, 15],
           temperature_2m_min: [8, 7], precipitation_probability_max: [10, 80] },
};

test('tahmin cevabı sade nesneye çevrilir', () => {
  const r = tahminiCozumle(ORNEK);
  assert.equal(r.simdi.sicaklik, 18.4);
  assert.equal(r.simdi.tarih, '2025-10-10');
  assert.equal(r.gunler.length, 2);
  assert.deepEqual(r.gunler[1], { tarih: '2025-10-11', kod: 61, enYuksek: 15, enDusuk: 7, yagisOlasiligi: 80 });
});

test('yağış olasılığı yoksa null olur', () => {
  const veri = structuredClone(ORNEK);
  delete veri.daily.precipitation_probability_max;
  assert.equal(tahminiCozumle(veri).gunler[0].yagisOlasiligi, null);
});

test('beklenmeyen cevap anlaşılır hata verir', () => {
  assert.throws(() => tahminiCozumle(null), /beklenmeyen biçimde/);
  assert.throws(() => tahminiCozumle({}), /beklenmeyen biçimde/);
  assert.throws(() => tahminiCozumle({ current: {}, daily: {} }), /beklenmeyen biçimde/);
});

test('yer etiketi tekrarları ve boş alanları atar', () => {
  assert.equal(yerEtiketi({ name: 'Konya', admin1: 'Konya', country: 'Türkiye' }), 'Konya, Türkiye');
  assert.equal(yerEtiketi({ name: 'Ankara', admin1: 'Ankara', country: 'Türkiye' }), 'Ankara, Türkiye');
  assert.equal(yerEtiketi({ name: 'Cihanbeyli', admin1: 'Konya', country: 'Türkiye' }), 'Cihanbeyli, Konya, Türkiye');
  assert.equal(yerEtiketi({ name: 'X' }), 'X');
});
