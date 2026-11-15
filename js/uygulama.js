import {
  havaDurumu, yonAdi, sicaklikSinifi, dereceMetni, gunAdi,
  sehirAramaURL, tahminURL, tahminiCozumle, yerEtiketi,
} from './mantik.js';

const VARSAYILAN_YER = { ad: 'Konya, Türkiye', enlem: 37.8714, boylam: 32.4846 };
const ANAHTAR_YER = 'hava-panosu:son-yer';
const ANAHTAR_VERI = 'hava-panosu:son-veri';
const ZAMAN_ASIMI_MS = 10_000;

const $ = (id) => document.getElementById(id);
const el = {
  form: $('arama-formu'), sehir: $('sehir'), konum: $('konum-dugmesi'), oneriler: $('oneriler'), durum: $('durum'),
  simdi: $('simdi'), yerAdi: $('yer-adi'), simge: $('simdi-simge'), derece: $('simdi-derece'),
  aciklama: $('simdi-aciklama'), hissedilen: $('d-hissedilen'), nem: $('d-nem'), ruzgar: $('d-ruzgar'),
  guncelleme: $('guncelleme'), gunlerBolumu: $('gunler-bolumu'), gunler: $('gunler'),
};

// localStorage kapalı olabilir (gizli mod vb.); uygulama onsuz da çalışmalı
const depo = {
  oku(anahtar) { try { return JSON.parse(localStorage.getItem(anahtar)); } catch { return null; } },
  yaz(anahtar, deger) { try { localStorage.setItem(anahtar, JSON.stringify(deger)); } catch { /* yoksay */ } },
};

function durumYaz(metin, tur = '') {
  el.durum.textContent = metin;
  el.durum.className = `durum ${tur}`.trim();
}

async function jsonGetir(url) {
  const kontrol = new AbortController();
  const zamanlayici = setTimeout(() => kontrol.abort(), ZAMAN_ASIMI_MS);
  try {
    const cevap = await fetch(url, { signal: kontrol.signal });
    if (!cevap.ok) throw new Error(`Sunucu hatası (${cevap.status})`);
    return await cevap.json();
  } catch (hata) {
    if (hata.name === 'AbortError') throw new Error('İstek zaman aşımına uğradı');
    throw hata;
  } finally {
    clearTimeout(zamanlayici);
  }
}

// ---- Çizim: tüm metinler textContent ile yazılır (innerHTML kullanılmaz -> XSS riski yok) ----
function metinli(etiket, sinif, metin) {
  const e = document.createElement(etiket);
  if (sinif) e.className = sinif;
  e.textContent = metin;
  return e;
}

function ciz(yer, tahmin, cevrimdisiZamani = null) {
  const h = havaDurumu(tahmin.simdi.kod);
  el.yerAdi.textContent = yer.ad;
  el.simge.textContent = h.simge;
  el.derece.textContent = dereceMetni(tahmin.simdi.sicaklik);
  el.derece.className = `buyuk-derece ${sicaklikSinifi(tahmin.simdi.sicaklik)}`;
  el.aciklama.textContent = h.aciklama;
  el.hissedilen.textContent = dereceMetni(tahmin.simdi.hissedilen);
  el.nem.textContent = Number.isFinite(tahmin.simdi.nem) ? `%${tahmin.simdi.nem}` : '—';
  el.ruzgar.textContent = Number.isFinite(tahmin.simdi.ruzgar)
    ? `${Math.round(tahmin.simdi.ruzgar)} km/s ${yonAdi(tahmin.simdi.ruzgarYonu)}` : '—';
  el.guncelleme.textContent = cevrimdisiZamani
    ? `Çevrimdışı: ${new Date(cevrimdisiZamani).toLocaleString('tr-TR')} tarihli son veri gösteriliyor`
    : `Güncellendi: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

  el.gunler.replaceChildren(...tahmin.gunler.map((g) => {
    const gh = havaDurumu(g.kod);
    const li = document.createElement('li');
    const derece = metinli('span', 'gun-derece', '');
    derece.append(
      metinli('strong', sicaklikSinifi(g.enYuksek), dereceMetni(g.enYuksek)),
      document.createTextNode(' / '),
      metinli('span', 'dusuk', dereceMetni(g.enDusuk)),
    );
    const bilgi = metinli('span', 'gun-yagis', Number.isFinite(g.yagisOlasiligi) ? `${gh.aciklama} · 💧%${g.yagisOlasiligi}` : gh.aciklama);
    li.append(metinli('span', '', gunAdi(g.tarih, tahmin.simdi.tarih)), metinli('span', 'gun-simge', gh.simge), bilgi, derece);
    return li;
  }));

  el.simdi.hidden = false;
  el.gunlerBolumu.hidden = false;
}

// ---- Veri akışı ----
async function yerGoster(yer) {
  depo.yaz(ANAHTAR_YER, yer);
  el.oneriler.hidden = true;
  durumYaz('Yükleniyor…');
  el.simdi.classList.add('yukleniyor');
  try {
    const tahmin = tahminiCozumle(await jsonGetir(tahminURL(yer.enlem, yer.boylam)));
    depo.yaz(ANAHTAR_VERI, { yer, tahmin, zaman: Date.now() });
    ciz(yer, tahmin);
    durumYaz('');
  } catch (hata) {
    // Ağ yoksa aynı yerin son verisini göster
    const kayit = depo.oku(ANAHTAR_VERI);
    if (kayit && kayit.yer && kayit.yer.ad === yer.ad) {
      ciz(yer, kayit.tahmin, kayit.zaman);
      durumYaz('Bağlantı kurulamadı, son kaydedilen veri gösteriliyor.', 'uyari');
    } else {
      el.simdi.hidden = true;
      el.gunlerBolumu.hidden = true;
      durumYaz(`Hava durumu alınamadı: ${hata.message}`, 'hata');
    }
  } finally {
    el.simdi.classList.remove('yukleniyor');
  }
}

async function sehirAra(ad) {
  durumYaz('Aranıyor…');
  el.oneriler.hidden = true;
  try {
    const sonuc = await jsonGetir(sehirAramaURL(ad));
    const liste = (sonuc.results || []).map((y) => ({ ad: yerEtiketi(y), enlem: y.latitude, boylam: y.longitude }));
    if (liste.length === 0) { durumYaz(`"${ad}" için sonuç bulunamadı.`, 'hata'); return; }
    if (liste.length === 1) { await yerGoster(liste[0]); return; }

    durumYaz('Birden fazla sonuç bulundu, birini seçin:');
    el.oneriler.replaceChildren(...liste.map((y) => {
      const li = document.createElement('li');
      const d = metinli('button', '', y.ad);
      d.type = 'button';
      d.addEventListener('click', () => yerGoster(y));
      li.append(d);
      return li;
    }));
    el.oneriler.hidden = false;
  } catch (hata) {
    durumYaz(`Arama başarısız: ${hata.message}`, 'hata');
  }
}

function konumKullan() {
  if (!('geolocation' in navigator)) { durumYaz('Tarayıcınız konum özelliğini desteklemiyor.', 'hata'); return; }
  durumYaz('Konum alınıyor…');
  navigator.geolocation.getCurrentPosition(
    (p) => yerGoster({ ad: 'Konumum', enlem: Number(p.coords.latitude.toFixed(4)), boylam: Number(p.coords.longitude.toFixed(4)) }),
    (h) => durumYaz(h.code === 1 ? 'Konum izni verilmedi.' : 'Konum alınamadı.', 'hata'),
    { timeout: 10_000, maximumAge: 300_000 },
  );
}

el.form.addEventListener('submit', (e) => {
  e.preventDefault();
  const ad = el.sehir.value.trim();
  if (ad.length >= 2) sehirAra(ad);
});
el.konum.addEventListener('click', konumKullan);

yerGoster(depo.oku(ANAHTAR_YER) || VARSAYILAN_YER);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* çevrimdışı önbellek olmadan da çalışır */ });
}
