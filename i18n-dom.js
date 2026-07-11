/* ─────────────────────────────────────────────────────────────
   OTOMATİK DOM ÇEVİRİ KATMANI  (TR kaynak → EN / DE)
   Kullanım: <script src="i18n-dom.js"></script> + dil seçici
   - Metinler HTML/JS'te Türkçe kalır (kaynak dil).
   - translatePage(lang) tüm görünür metinleri sözlükten çevirir.
   - Her text node'un orijinal TR'si saklanır → dil değişimi kayıpsız.
───────────────────────────────────────────────────────────── */

// TR metin  →  { en, de }   (tam eşleşme, trim'li)
const TRMAP = {
  // ── Genel / topbar ──
  "← Ana Sayfa": {en:"← Home", de:"← Startseite"},
  "Çıkış Yap": {en:"Log Out", de:"Abmelden"},
  "⚙️ Ayarlar": {en:"⚙️ Settings", de:"⚙️ Einstellungen"},
  // ── Giriş ekranı ──
  "Giriş Yap": {en:"Log In", de:"Anmelden"},
  "E-posta ve şifrenle giriş yap — hesap türüne göre yönlendirilirsin.": {en:"Log in with your email and password — you'll be routed based on your account type.", de:"Melde dich mit E-Mail und Passwort an — du wirst je nach Kontotyp weitergeleitet."},
  "E-posta veya şifre hatalı.": {en:"Email or password is incorrect.", de:"E-Mail oder Passwort ist falsch."},
  "Şimdi ücretsiz oluştur →": {en:"Create one for free →", de:"Jetzt kostenlos erstellen →"},
  "🎓 Demo Hesaplar (tıkla → otomatik doldur)": {en:"🎓 Demo Accounts (click → autofill)", de:"🎓 Demo-Konten (klicken → automatisch ausfüllen)"},
  "E-POSTA": {en:"EMAIL", de:"E-MAIL"},
  "ŞİFRE": {en:"PASSWORD", de:"PASSWORT"},
  // ── Rol rozetleri / alt başlık ──
  "🎓 Öğrenci": {en:"🎓 Student", de:"🎓 Lernende:r"},
  "👩‍🏫 Eğitmen": {en:"👩‍🏫 Instructor", de:"👩‍🏫 Trainer:in"},
  // ── İstatistik blokları ──
  "Bölüm Bazlı İlerleme Grafiği": {en:"Section-Based Progress Chart", de:"Abschnittsbasiertes Fortschrittsdiagramm"},
  "Sınav Geçmişi": {en:"Exam History", de:"Prüfungsverlauf"},
  "Grafik yükleniyor…": {en:"Loading chart…", de:"Diagramm wird geladen…"},
  "Henüz deneme sınavı çözülmedi.": {en:"No mock exam taken yet.", de:"Noch keine Musterprüfung absolviert."},
  "Sıfırla": {en:"Reset", de:"Zurücksetzen"},
  "Sınav": {en:"Exam", de:"Prüfung"},
  "Puan": {en:"Score", de:"Punkte"},
  "Deneme Sınavı": {en:"Mock Exam", de:"Musterprüfung"},
  "A1 İstatistikleri": {en:"A1 Statistics", de:"A1-Statistiken"},
  "B1 İstatistikleri": {en:"B1 Statistics", de:"B1-Statistiken"},
  // ── Sınav sonuç detay modalı ──
  "Sınav Sonuç Detayı": {en:"Exam Result Details", de:"Prüfungsergebnis-Details"},
  "Toplam Puan": {en:"Total Score", de:"Gesamtpunktzahl"},
  "Yüzde": {en:"Percentage", de:"Prozent"},
  "✅ Geçer not": {en:"✅ Passing grade", de:"✅ Bestanden"},
  "Bölüm Bazlı Sonuçlar": {en:"Section-Based Results", de:"Abschnittsbasierte Ergebnisse"},
  "Tüm Sınav Sonuçları": {en:"All Exam Results", de:"Alle Prüfungsergebnisse"},
  "Tarih": {en:"Date", de:"Datum"},
  // ── stats-row kartları ──
  "Mock Exam Credit": {en:"Mock Exam Credit", de:"Musterprüfung-Guthaben"},
  "Toplam Oturum": {en:"Total Sessions", de:"Sitzungen gesamt"},
  "Aktif Modül": {en:"Active Module", de:"Aktives Modul"},
  // ── Modül alıştırmaları ──
  "📝 Modül Alıştırmaları (B1)": {en:"📝 Module Exercises (B1)", de:"📝 Modulübungen (B1)"},
  "📝 Modül Alıştırmaları (A1)": {en:"📝 Module Exercises (A1)", de:"📝 Modulübungen (A1)"},
  "Deneme Sınavı": {en:"Mock Exam", de:"Musterprüfung"},
  "✍️ Rastgele Soru": {en:"✍️ Random Question", de:"✍️ Zufällige Frage"},
  "✍️ Yakında": {en:"✍️ Coming Soon", de:"✍️ Demnächst"},
  "🔒 Kilitli": {en:"🔒 Locked", de:"🔒 Gesperrt"},
  "A1 içeriği yakında admin panelinden eklenecek.": {en:"A1 content will be added soon via the admin panel.", de:"A1-Inhalte werden bald über das Admin-Panel hinzugefügt."},
  "🔒 Kilit: ücretsiz hesap → 1 set açık · Her 3 referans → +1 set · Premium → tümü açık": {en:"🔒 Lock: free account → 1 set open · Every 3 referrals → +1 set · Premium → all open", de:"🔒 Sperre: kostenloses Konto → 1 Satz offen · Alle 3 Empfehlungen → +1 Satz · Premium → alle offen"},
  // ── Sınav Merkezi ──
  "Sınav Merkezi": {en:"Exam Center", de:"Prüfungszentrum"},
  // ── Davet paneli ──
  "🎁 Arkadaşlarını Davet Et, Ücretsiz Soru Setleri Kazan": {en:"🎁 Invite Friends, Earn Free Question Sets", de:"🎁 Freunde einladen, kostenlose Fragensätze verdienen"},
  "Her 3 arkadaşın bir soru setini tamamladığında, hesabında otomatik olarak 1 yeni soru seti ücretsiz açılır. Davet sınırı yok.": {en:"For every 3 friends who complete a question set, 1 new set is automatically unlocked in your account for free. No invite limit.", de:"Für je 3 Freunde, die einen Fragensatz abschließen, wird 1 neuer Satz kostenlos freigeschaltet. Kein Einladungslimit."},
  "Davet Bağlantın": {en:"Your Invite Link", de:"Dein Einladungslink"},
  "Kopyala": {en:"Copy", de:"Kopieren"},
  "Sonraki sete kalan": {en:"Until next set", de:"Bis zum nächsten Satz"},
  // ── Ayarlar modalı ──
  "Hesap bilgilerini buradan yönet.": {en:"Manage your account details here.", de:"Verwalte hier deine Kontodaten."},
  "👤 Hesap": {en:"👤 Account", de:"👤 Konto"},
  "✉️ E-posta": {en:"✉️ Email", de:"✉️ E-Mail"},
  "🔒 Şifre": {en:"🔒 Password", de:"🔒 Passwort"},
  "Ad Soyad": {en:"Full Name", de:"Vollständiger Name"},
  "Seviye": {en:"Level", de:"Niveau"},
  "Seviye değişimi için tam üyelik gerekir": {en:"Full membership required to change level", de:"Vollmitgliedschaft erforderlich, um das Niveau zu ändern"},
  "Kaydet": {en:"Save", de:"Speichern"},
  "Mevcut E-posta": {en:"Current Email", de:"Aktuelle E-Mail"},
  "Yeni E-posta": {en:"New Email", de:"Neue E-Mail"},
  "E-postayı Değiştir": {en:"Change Email", de:"E-Mail ändern"},
  "Yeni e-postana bir onay bağlantısı gönderilir. Onayladıktan sonra değişiklik geçerli olur.": {en:"A confirmation link is sent to your new email. The change takes effect after you confirm.", de:"An deine neue E-Mail wird ein Bestätigungslink gesendet. Die Änderung wird nach Bestätigung wirksam."},
  "Mevcut Şifre": {en:"Current Password", de:"Aktuelles Passwort"},
  "Yeni Şifre": {en:"New Password", de:"Neues Passwort"},
  "Yeni Şifre (Tekrar)": {en:"New Password (Repeat)", de:"Neues Passwort (Wiederholen)"},
  "Şifreyi Değiştir": {en:"Change Password", de:"Passwort ändern"},
  "⚙️ Ayarlar": {en:"⚙️ Settings", de:"⚙️ Einstellungen"},
  // ── Eğitmen dashboard ──
  "Tamamlanan Oturum": {en:"Completed Sessions", de:"Abgeschlossene Sitzungen"},
  "Toplam Kazanç": {en:"Total Earnings", de:"Gesamteinnahmen"},
  "Ortalama Puan": {en:"Average Rating", de:"Durchschnittsbewertung"},
  "Sınav Seviyesi": {en:"Exam Level", de:"Prüfungsniveau"},
  "Yaklaşan Oturumlar": {en:"Upcoming Sessions", de:"Bevorstehende Sitzungen"},
  "Son Kazançlar": {en:"Recent Earnings", de:"Letzte Einnahmen"},
  "Ders Saatlerini Yönet": {en:"Manage Lesson Hours", de:"Unterrichtszeiten verwalten"},
  "Profil Bilgileri": {en:"Profile Info", de:"Profil-Infos"},
  "Uzmanlık": {en:"Expertise", de:"Fachgebiet"},
  "Durum": {en:"Status", de:"Status"},
  // ── Bildirimler ──
  "İlerleme Sıfırlandı": {en:"Progress Reset", de:"Fortschritt zurückgesetzt"},
  "Kopyalandı!": {en:"Copied!", de:"Kopiert!"},
  "Kaydedildi ✓": {en:"Saved ✓", de:"Gespeichert ✓"},
};

// Prefix/parçalı çeviriler (dinamik metin içeren): "Seviyen: B1" gibi
const TRPREFIX = [
  ["Seviyen:", {en:"Your level:", de:"Dein Niveau:"}],
  ["Modül:", {en:"Module:", de:"Modul:"}],
  ["Deneme Sınavı ", {en:"Mock Exam ", de:"Musterprüfung "}],
  ["arkadaş daha → 1 yeni soru seti", {en:"more friends → 1 new question set", de:"weitere Freunde → 1 neuer Fragensatz"}],
];

let CUR_LANG = localStorage.getItem('prufready_lang') || 'tr';

function _walkText(node, cb) {
  if (node.nodeType === 3) { cb(node); return; }
  if (node.nodeType !== 1) return;
  // script/style/textarea/input içine girme
  const tag = node.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return;
  for (let c = node.firstChild; c; c = c.nextSibling) _walkText(c, cb);
}

function translatePage(lang) {
  CUR_LANG = lang;
  localStorage.setItem('prufready_lang', lang);
  document.documentElement.lang = lang;

  _walkText(document.body, node => {
    // İlk görüşte orijinal TR'yi sakla
    if (node._tr === undefined) {
      const t = node.textContent;
      if (!t || !t.trim()) return;         // boş node atla
      node._tr = t;
    }
    const orig = node._tr;
    const key = orig.trim();
    if (lang === 'tr') { node.textContent = orig; return; }

    const map = TRMAP[key];
    if (map && map[lang]) {
      node.textContent = orig.replace(key, map[lang]);
      return;
    }
    // Prefix/parçalı dene
    for (const [pre, tr] of TRPREFIX) {
      if (key.includes(pre) && tr[lang]) {
        node.textContent = orig.replace(pre, tr[lang]);
        return;
      }
    }
    // Eşleşme yoksa TR kalır
  });

  // Dil seçici aktif durumu
  document.querySelectorAll('#lang-switch button').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang));
}

// Global dil değiştir — dashboard'da loggedUser varsa dinamik içeriği yeniden çevir
function setLang(lang) {
  if (!['tr','en','de'].includes(lang)) lang = 'tr';
  translatePage(lang);
}
