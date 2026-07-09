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

async function sbGetProfile(userId) {
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
  return data;
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

// ── HÖRVERSTEHENmit SORULARI ─────────────────────────────────

async function sbLoadHsvQuestions(sectionId) {
  const { data } = await sb.from('hsv_questions')
    .select('*').eq('section_id', sectionId).order('created_at');
  return data || [];
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
  console.warn('[ExamReady] Supabase yapılandırılmamış — localStorage modu aktif.');
}
