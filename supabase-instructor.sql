-- ── EĞİTMEN BAŞVURU SİSTEMİ ──────────────────────────────────
-- profiles tablosuna eğitmen onay alanları ekle

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
-- status: 'approved' (öğrenciler + onaylı eğitmenler) | 'pending' (onay bekleyen eğitmen)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS expertise TEXT;          -- eğitmen uzmanlık: A1, B1, A1/B1
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience TEXT;         -- deneyim açıklaması
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS application_note TEXT;   -- başvuru mesajı

-- Adminlerin tüm profilleri okuyabilmesi için (eğitmen onayı) — herkes okuyabilir policy
DROP POLICY IF EXISTS "Profiller okunabilir" ON profiles;
CREATE POLICY "Profiller okunabilir" ON profiles FOR SELECT USING (true);
