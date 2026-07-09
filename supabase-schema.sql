-- ── EXAMREADY SUPABASE ŞEMASI ──────────────────────────────────

-- 1. Kullanıcı profilleri (auth.users ile bağlı)
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  name           TEXT,
  role           TEXT DEFAULT 'student',        -- student | instructor
  level          TEXT DEFAULT 'B1',             -- A1 | B1 | BOTH
  module         TEXT DEFAULT 'B1',
  credits        INTEGER DEFAULT 0,
  referral_code  TEXT UNIQUE,
  referral_count INTEGER DEFAULT 0,
  referred_by    TEXT,
  unlocked_full  BOOLEAN DEFAULT FALSE,
  source         TEXT DEFAULT 'registered',     -- registered | demo
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Sınav istatistikleri
CREATE TABLE IF NOT EXISTS exam_stats (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES profiles(id) ON DELETE CASCADE,
  level              TEXT NOT NULL,             -- A1 | B1
  exams_completed    INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct  INTEGER DEFAULT 0,
  history            JSONB DEFAULT '[]',
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, level)
);

-- 3. Modül alıştırmaları (LSV / SPB)
CREATE TABLE IF NOT EXISTS module_sets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key  TEXT NOT NULL,                    -- B1_LSV_T1, B1_SPB_T2 ...
  set_num     INTEGER NOT NULL,
  structure   TEXT NOT NULL,                    -- lsv-t1, lsv-t2, spb-t1 ...
  content     JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_key, set_num)
);

-- 4. Schreiben soru havuzu
CREATE TABLE IF NOT EXISTS schreiben_questions (
  id        TEXT PRIMARY KEY,
  type      TEXT DEFAULT 'brief',               -- brief | email | notiz
  level     TEXT DEFAULT 'B1',
  set_no    INTEGER,
  task      TEXT NOT NULL,
  points    JSONB DEFAULT '[]',
  example   TEXT,
  criteria  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Hörverstehen soruları
CREATE TABLE IF NOT EXISTS hsv_questions (
  id             TEXT PRIMARY KEY,
  section_id     TEXT NOT NULL,                 -- B1_T1, B1_T2 ...
  aussage        TEXT,
  question       TEXT,
  options        JSONB,
  correct_answer TEXT,
  feedback       TEXT,
  audio_key      TEXT,                          -- Supabase Storage'daki dosya yolu
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Mock Exam takvimi
CREATE TABLE IF NOT EXISTS schedules (
  slot_key   TEXT PRIMARY KEY,                  -- "2026-7-15|10:00"
  coach_email TEXT,
  coach_name  TEXT,
  type        TEXT DEFAULT 'Mock Exam',
  spots       INTEGER DEFAULT 2,
  booked_by   JSONB DEFAULT '[]',
  level       TEXT,
  booked_at   JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── GÜVENLİK KURALLARI (RLS) ─────────────────────────────────

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_stats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sets        ENABLE ROW LEVEL SECURITY;
ALTER TABLE schreiben_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hsv_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules          ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir: içerik tabloları
CREATE POLICY "Herkes okur" ON module_sets        FOR SELECT USING (true);
CREATE POLICY "Herkes okur" ON schreiben_questions FOR SELECT USING (true);
CREATE POLICY "Herkes okur" ON hsv_questions       FOR SELECT USING (true);
CREATE POLICY "Herkes okur" ON schedules           FOR SELECT USING (true);

-- Kullanıcı kendi profilini yönetir
CREATE POLICY "Kendi profilim" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Kullanıcı kendi istatistiklerini yönetir
CREATE POLICY "Kendi istatistiklerim" ON exam_stats
  FOR ALL USING (auth.uid() = user_id);

-- Takvim: herkes yazar (booking için)
CREATE POLICY "Takvim yaz" ON schedules FOR ALL USING (true);

-- ── STORAGE ───────────────────────────────────────────────────
-- Dashboard → Storage → New bucket → isim: "audio" → Public: true
-- (UI üzerinden yapın, SQL ile değil)
