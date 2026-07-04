# Yönetim Paneli Kurulumu (Firebase + Cloudinary) — Ücretsiz

Panelin çalışması için 2 ücretsiz hesap gerekiyor: **Firebase** (veriler) ve **Cloudinary** (fotoğraflar).
Kredi kartı gerekmez. Tüm bilgileri tek dosyaya — `firebase-config.js` — yazacaksın.

---

## 📍 İLERLEME DURUMU

- [ ] Firebase projesi oluştur (örn. `armutlu-cicek`)
- [ ] Firestore kuruldu + güvenlik kuralları yayınlandı
- [ ] Authentication (e-posta/şifre) açıldı + kullanıcı eklendi
- [ ] Firebase config `firebase-config.js`'e yerleştirildi
- [ ] Cloudinary kur (cloud name + unsigned preset)
- [ ] Paneli aç, giriş yap, "Başlangıç verisini yükle"

---

## 1) Firebase projesi oluştur (veriler için)

1. https://console.firebase.google.com → **Proje ekle** → bir isim ver (örn. `armutlu-cicek`).
2. Sol menü **Build > Firestore Database** → **Veritabanı oluştur** → **Production mode** → bölge `eur3 (europe-west)` seç.
3. **Rules (Kurallar)** sekmesine geç, içeriği şununla değiştir ve **Yayınla**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;               // herkes ürünleri görebilir (site için)
         allow write: if request.auth != null;  // sadece giriş yapan admin yazabilir
       }
     }
   }
   ```

4. Sol menü **Build > Authentication** → **Başla** → **Sign-in method** → **E-posta/Şifre**'yi **Etkinleştir**.
5. **Users** sekmesi → **Add user** → çiçekçinin e-postası + bir şifre yaz. (Panele bununla giriş yapılacak.)
6. Proje ayarları (⚙️ üst sol) → **Genel** → aşağı in → **Uygulamalarınız** → **Web** (`</>`) simgesine tıkla → bir takma ad ver → **Kaydet**.
7. Çıkan `firebaseConfig = { ... }` bloğundaki değerleri kopyala.

---

## 2) Cloudinary hesabı (fotoğraflar için)

1. https://cloudinary.com → ücretsiz kayıt ol.
2. Panelde (Dashboard) **Cloud name** değerini not al.
3. **Settings (⚙️) > Upload > Upload presets > Add upload preset**:
   - **Signing Mode: Unsigned** seç (önemli!)
   - Kaydet ve **preset adını** not al.

---

## 3) `firebase-config.js` dosyasını doldur

Proje klasöründeki `firebase-config.js` dosyasını aç ve `BURAYA...` yazan yerleri kendi bilgilerinle değiştir:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
export const cloudinary = {
  cloudName: "senin-cloud-name",
  uploadPreset: "senin-preset-adin",
};
```

---

## 4) Paneli aç ve başlat

1. Siteyi sunucuyla aç (örn. `http://localhost:3000/admin.html`). **Not:** Modüller `file://` ile çalışmaz, bir sunucu gerekir.
2. Adım 1.5'te oluşturduğun **e-posta + şifre** ile giriş yap.
3. İlk girişte üstte **"Başlangıç verisini yükle"** butonu çıkar → tıkla. Mevcut 6 ürün, kategoriler ve ayarlar yüklenir.
4. Artık ürün ekle/düzenle/sil, kategori yönet, ayarları değiştir. Değişiklikler **ana sitede anında** görünür.

---

## Önemli notlar

- **Güvenlik:** `firebase-config.js` içindeki `apiKey` gizli değildir, herkese açık olması normaldir. Asıl güvenlik yukarıdaki Firestore **kuralları** + **şifre** ile sağlanır. Paneli yazmak için giriş şart.
- **`admin.html` adresi:** Dilersen dosya adını tahmini zor bir şeyle değiştir (örn. `yonetim-8341.html`) — ekstra güvenlik.
- **Ücretsiz limitler:** Firestore (50K okuma/gün) ve Cloudinary (25GB) bir çiçekçi için fazlasıyla yeterli.
- **Yayına alma (opsiyonel):** Siteyi ücretsiz yayınlamak için Netlify / Vercel / Firebase Hosting kullanabilirsin (klasörü sürükle-bırak yeterli).
