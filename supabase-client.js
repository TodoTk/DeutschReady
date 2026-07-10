// ── SUPABASE YAPILANDIRMASI ──────────────────────────────────
// Bu değerleri Supabase Dashboard → Settings → API'den alın
const SUPABASE_URL  = 'https://ezabrktojywcfpasaelx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YWJya3Rvanl3Y2ZwYXNhZWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MDM5NjUsImV4cCI6MjA5OTE3OTk2NX0.OCuKxXURDZrp0nWPncsLVMxr993zGMxajWLkTBLaNVY';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── AUTH ─────────────────────────────────────────────────────

async function sbSignUp(email, password, name, level) {
  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { name, level } }
  });
  if (error) throw error;

  // Profil oluştur
  if (data.user) {
    await sb.from('profiles').upsert({
      id            : data.user.id,
      email,
      name,
      level,
      module        : level,
      role          : 'student',
      source        : 'registered',
      referral_code : 'REF' + Math.random().toString(36).substr(2,6).toUpperCase(),
    });
  }
  return data;
}

async function sbSignIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function sbSignOut() {
  await sb.auth.signOut();
}

async function sbGetUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// ── EĞİTMEN ONAY (ADMIN) ──────────────────────────────────────

// Bekleyen eğitmen başvurularını getir
async function sbLoadPendingInstructors() {
  const { data } = await sb.from('profiles')
    .select('*').eq('role','instructor').eq('status','pending').order('created_at');
  return data || [];
}

// Onaylı eğitmenleri getir
async function sbLoadApprovedInstructors() {
  const { data } = await sb.from('profiles')
    .select('*').eq('role','instructor').eq('status','approved').order('created_at');
  return data || [];
}

// Eğitmen başvurusunu onayla
async function sbApproveInstructor(userId) {
  const { error } = await sb.from('profiles').update({ status:'approved' }).eq('id', userId);
  if (error) throw error;
}

// Eğitmen başvurusunu reddet (sil)
async function sbRejectInstructor(userId) {
  const { error } = await sb.from('profiles').delete().eq('id', userId);
  if (error) throw error;
}

// ── HESAP AYARLARI ────────────────────────────────────────────

// İsim (ve opsiyonel seviye) güncelle — profiles tablosu
async function sbUpdateProfile(patch) {
  const user = await sbGetUser();
  if (!user) throw new Error('Oturum bulunamadı.');
  const { error } = await sb.from('profiles').update(patch).eq('id', user.id);
  if (error) throw error;
}

// E-posta değiştir — Supabase Auth (onay maili gönderilir)
async function sbUpdateEmail(newEmail) {
  const { error } = await sb.auth.updateUser({ email: newEmail });
  if (error) throw error;
  // profiles tablosundaki email'i de güncelle
  const user = await sbGetUser();
  if (user) await sb.from('profiles').update({ email: newEmail }).eq('id', user.id);
}

// Şifre değiştir — Supabase Auth
async function sbUpdatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Mevcut şifreyi doğrula (yeniden giriş deneyerek)
async function sbVerifyPassword(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return !error;
}

async function sbGetProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  if (!data) return null;
  // snake_case → camelCase + dashboard'un beklediği tüm alanların varsayılanları
  return {
    ...data,
    referralCount : data.referral_count || 0,
    referralCode  : data.referral_code || null,
    unlockedFull  : !!data.unlocked_full,
    credits       : data.credits || 0,
    module        : data.module || data.level || 'B1',
    initials      : (data.name||'?').split(' ').map(p=>p[0]).join('').substring(0,2).toUpperCase(),
    color         : '#4f8ef7',
    sessions      : [],   // Supabase profilinde yok — boş dizi (render güvenliği)
    skills        : { Leseverstehen:0, Hörverständnis:0, Schreiben:0, Sprechen:0 }
  };
}

// ── SINAV İSTATİSTİKLERİ ─────────────────────────────────────

async function sbLoadStats(userId) {
  const { data } = await sb.from('exam_stats').select('*').eq('user_id', userId);
  if (!data) return {};
  const result = {};
  data.forEach(row => { result[row.level] = row; });
  return result;
}

async function sbSaveStats(userId, level, patch) {
  // Mevcut kaydı al
  const { data: existing } = await sb.from('exam_stats')
    .select('*').eq('user_id', userId).eq('level', level).single();

  if (existing) {
    await sb.from('exam_stats').update({
      ...patch,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).eq('level', level);
  } else {
    await sb.from('exam_stats').insert({
      user_id: userId,
      level,
      ...patch,
      updated_at: new Date().toISOString()
    });
  }
}

async function sbPushExamHistory(userId, level, historyEntry) {
  const { data: existing } = await sb.from('exam_stats')
    .select('*').eq('user_id', userId).eq('level', level).single();

  if (existing) {
    const history = [...(existing.history || []), historyEntry];
    await sb.from('exam_stats').update({
      exams_completed    : (existing.exams_completed || 0) + 1,
      questions_answered : (existing.questions_answered || 0) + historyEntry.total,
      questions_correct  : (existing.questions_correct  || 0) + historyEntry.score,
      history,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId).eq('level', level);
  } else {
    await sb.from('exam_stats').insert({
      user_id            : userId,
      level,
      exams_completed    : 1,
      questions_answered : historyEntry.total,
      questions_correct  : historyEntry.score,
      history            : [historyEntry],
      updated_at: new Date().toISOString()
    });
  }
}

// Oturumdaki auth kullanıcısını otomatik bulur, sınav sonucunu ekler.
// entry: { date, score, total, examId?, sections? }
// Başarılıysa true, kullanıcı yoksa / hata varsa false döner (çağıran localStorage'a düşer).
async function sbRecordExam(level, entry) {
  try {
    const user = await sbGetUser();
    if (!user) return false;
    await sbPushExamHistory(user.id, level, entry);
    return true;
  } catch(e) { console.error('sbRecordExam hatası:', e); return false; }
}

// Oturumdaki kullanıcının tüm istatistiklerini dashboard formatında döndürür.
// { A1:{examsCompleted,questionsAnswered,questionsCorrect,history}, B1:{...} }
async function sbLoadMyStats() {
  try {
    const user = await sbGetUser();
    if (!user) return null;
    const { data } = await sb.from('exam_stats').select('*').eq('user_id', user.id);
    const result = {};
    (data || []).forEach(r => {
      result[r.level] = {
        examsCompleted    : r.exams_completed || 0,
        questionsAnswered : r.questions_answered || 0,
        questionsCorrect  : r.questions_correct || 0,
        history           : r.history || []
      };
    });
    return result;
  } catch(e) { console.error('sbLoadMyStats hatası:', e); return null; }
}

// ── MODÜL ALIŞTIRMALARI ───────────────────────────────────────

async function sbLoadModuleSets() {
  const { data } = await sb.from('module_sets').select('*');
  if (!data) return {};
  const result = {};
  data.forEach(row => {
    if (!result[row.module_key]) result[row.module_key] = {};
    result[row.module_key][row.set_num] = {
      hasContent : true,
      structure  : row.structure,
      content    : row.content,
      updatedAt  : row.updated_at
    };
  });
  return result;
}

async function sbSaveModuleSet(moduleKey, setNum, structure, content) {
  await sb.from('module_sets').upsert({
    module_key : moduleKey,
    set_num    : setNum,
    structure,
    content,
    updated_at : new Date().toISOString()
  }, { onConflict: 'module_key,set_num' });
}

async function sbDeleteModuleSet(moduleKey, setNum) {
  await sb.from('module_sets')
    .delete().eq('module_key', moduleKey).eq('set_num', setNum);
}

// ── SCHREIBEN SORULARI ────────────────────────────────────────

async function sbLoadSchreiben() {
  const { data } = await sb.from('schreiben_questions').select('*').order('created_at');
  return data || [];
}

async function sbSaveSchreibenQ(q) {
  await sb.from('schreiben_questions').upsert(q, { onConflict: 'id' });
}

async function sbDeleteSchreibenQ(id) {
  await sb.from('schreiben_questions').delete().eq('id', id);
}

// ── HÖRVERSTEHEN SORULARI ─────────────────────────────────

async function sbLoadHsvQuestions(sectionId) {
  const { data } = await sb.from('hsv_questions')
    .select('*').eq('section_id', sectionId).order('created_at');
  return data || [];
}

// Tüm Hörverstehen sorularını çek, section bazlı grupla
// { B1_T1:{questions:[...]}, B1_T2:{...}, ... }
async function sbLoadAllHsv() {
  const { data } = await sb.from('hsv_questions').select('*').order('created_at');
  const result = {};
  (data || []).forEach(r => {
    if (!result[r.section_id]) result[r.section_id] = { questions: [] };
    result[r.section_id].questions.push({
      id: r.id,
      aussage: r.aussage,
      question: r.question,
      options: r.options,
      correctAnswer: r.correct_answer,
      feedback: r.feedback,
      audioKey: r.audio_key,
      audioName: r.audio_key
    });
  });
  return result;
}

async function sbSaveHsvQuestion(q) {
  await sb.from('hsv_questions').upsert(q, { onConflict: 'id' });
}

async function sbDeleteHsvQuestion(id) {
  await sb.from('hsv_questions').delete().eq('id', id);
}

// ── SES DOSYALARI (SUPABASE STORAGE) ─────────────────────────

async function sbUploadAudio(key, arrayBuffer) {
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const { error } = await sb.storage.from('audio').upload(key + '.mp3', blob, {
    upsert: true,
    contentType: 'audio/mpeg'
  });
  if (error) throw error;
}

function sbGetAudioUrl(key) {
  const { data } = sb.storage.from('audio').getPublicUrl(key + '.mp3');
  return data?.publicUrl || null;
}

async function sbDeleteAudio(key) {
  await sb.storage.from('audio').remove([key + '.mp3']);
}

// ── TAKVİM ───────────────────────────────────────────────────

async function sbLoadSchedule() {
  const { data } = await sb.from('schedules').select('*');
  if (!data) return {};
  const result = {};
  data.forEach(row => {
    result[row.slot_key] = {
      coachEmail : row.coach_email,
      coachName  : row.coach_name,
      type       : row.type,
      spots      : row.spots,
      bookedBy   : row.booked_by || [],
      level      : row.level,
      bookedAt   : row.booked_at || {}
    };
  });
  return result;
}

async function sbSaveScheduleSlot(key, slot) {
  await sb.from('schedules').upsert({
    slot_key    : key,
    coach_email : slot.coachEmail,
    coach_name  : slot.coachName,
    type        : slot.type,
    spots       : slot.spots,
    booked_by   : slot.bookedBy,
    level       : slot.level || null,
    booked_at   : slot.bookedAt || {},
    updated_at  : new Date().toISOString()
  }, { onConflict: 'slot_key' });
}

async function sbDeleteScheduleSlot(key) {
  await sb.from('schedules').delete().eq('slot_key', key);
}

// ── YARDIMCI: localStorage fallback ──────────────────────────
// Supabase bağlantısı olmadan da çalışır (offline/demo mod)
const USE_SUPABASE = SUPABASE_URL !== 'BURAYA_PROJECT_URL_YAPISTIR';

if (!USE_SUPABASE) {
  console.warn('[PrufReady] Supabase yapılandırılmamış — localStorage modu aktif.');
}
