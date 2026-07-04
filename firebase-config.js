// ============================================================
//  AYARLAR — BURAYI KENDİ BİLGİLERİNLE DOLDUR
//  (Adım adım talimat için KURULUM.md dosyasına bak)
// ============================================================

// 1) FIREBASE — Firebase Console > Proje Ayarları > "Web uygulaması" bölümünden
//    kopyaladığın değerleri buraya yapıştır.
export const firebaseConfig = {
  apiKey: "AIzaSyAEtoJcTZW-x6sAPdO3NqvRYt5UbidVAcA",
  authDomain: "armutlu-cicek.firebaseapp.com",
  projectId: "armutlu-cicek",
  storageBucket: "armutlu-cicek.firebasestorage.app",
  messagingSenderId: "334116940134",
  appId: "1:334116940134:web:bc2bb61e19f92375ee80a7",
};

// 2) CLOUDINARY — ücretsiz fotoğraf yükleme için.
//    Cloudinary panelinden "Cloud name" ve "unsigned upload preset" adını yaz.
export const cloudinary = {
  cloudName: "dgi8rfvfs",
  uploadPreset: "cicek_upload",
};

// Yardımcı: ayarların doldurulup doldurulmadığını kontrol eder.
export function isConfigured() {
  return !firebaseConfig.apiKey.startsWith("BURAYA");
}
export function isCloudinaryConfigured() {
  return !cloudinary.cloudName.startsWith("BURAYA");
}
