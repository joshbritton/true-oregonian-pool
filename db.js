// ============================================================
//  db.js — Supabase client + shared data helpers
//  Requires config.js to be loaded first.
// ============================================================

const db = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// ── Tournaments ──────────────────────────────────────────────

async function getTournament() {
  const { data, error } = await db
    .from('tournaments').select('*')
    .order('created_at', { ascending: false }).limit(1).single();
  if (error && error.code !== 'PGRST116') console.error(error);
  return data || null;
}

async function createTournament({ name, espnId, purse }) {
  const { data, error } = await db.from('tournaments')
    .insert({ name, espn_id: espnId, purse, status: 'setup' })
    .select().single();
  if (error) throw error;
  return data;
}

async function updateTournamentStatus(id, status) {
  const { error } = await db.from('tournaments').update({ status }).eq('id', id);
  if (error) throw error;
}

// ── Participants ─────────────────────────────────────────────

async function getParticipants(tournamentId) {
  const { data, error } = await db.from('participants').select('*')
    .eq('tournament_id', tournamentId).order('draft_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function createParticipants(tournamentId, names) {
  const rows = names.map((name, i) => ({ tournament_id: tournamentId, name, draft_order: i + 1 }));
  const { data, error } = await db.from('participants').insert(rows).select();
  if (error) throw error;
  return data;
}

async function deleteParticipants(tournamentId) {
  const { error } = await db.from('participants').delete().eq('tournament_id', tournamentId);
  if (error) throw error;
}

// ── Picks ────────────────────────────────────────────────────

async function getPicks(tournamentId) {
  const { data, error } = await db.from('picks')
    .select('*, participants(name)').eq('tournament_id', tournamentId)
    .order('pick_number', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function savePick({ tournamentId, participantId, golferName, pickNumber, round }) {
  const { error } = await db.from('picks').upsert({
    tournament_id: tournamentId, participant_id: participantId,
    golfer_name: golferName, pick_number: pickNumber, round,
  }, { onConflict: 'tournament_id,participant_id,golfer_name' });
  if (error) throw error;
}

async function deletePick(pickId) {
  const { error } = await db.from('picks').delete().eq('id', pickId);
  if (error) throw error;
}

// ── ESPN Live Scores ─────────────────────────────────────────

async function fetchESPNScores(espnEventId) {
  if (!espnEventId) return [];
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard/${espnEventId}/competitors`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return parseESPNCompetitors(json);
  } catch (e) { console.error('ESPN fetch failed:', e); return []; }
}

function parseESPNCompetitors(json) {
  const competitors = json?.competitors || json?.events?.[0]?.competitions?.[0]?.competitors || [];
  return competitors.map(c => {
    const stats = c.statistics || c.linescores || [];
    return {
      name:     c.athlete?.displayName || c.displayName || 'Unknown',
      pos:      c.status?.position?.displayName || c.position || '',
      score:    parseScore(c.score || c.totalScore || ''),
      scoreRaw: c.score || '',
      thru:     c.status?.thru || c.thru || '',
      today:    c.status?.todayScore || '',
      r1: getRound(stats,0), r2: getRound(stats,1),
      r3: getRound(stats,2), r4: getRound(stats,3),
    };
  });
}

function parseScore(s) {
  if (!s && s !== 0) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function getRound(stats, idx) {
  const s = stats[idx];
  if (!s) return null;
  const v = parseInt(s.displayValue || s.value || s, 10);
  return isNaN(v) ? null : v;
}

// ── Payouts ───────────────────────────────────────────────────

function calcPayouts(scores, purse, payoutPercents) {
  const result = {};
  const posGroups = {};
  scores.forEach(g => {
    const pos = parseInt((g.pos || '').replace(/[^0-9]/g, ''), 10);
    if (!isNaN(pos)) {
      if (!posGroups[pos]) posGroups[pos] = [];
      posGroups[pos].push(g.name);
    }
  });
  Object.entries(posGroups).forEach(([pos, names]) => {
    const p = parseInt(pos, 10);
    let totalPct = 0;
    for (let i = 0; i < names.length; i++) totalPct += (payoutPercents[p + i] || 0);
    const perPlayer = (totalPct / names.length / 100) * purse;
    names.forEach(n => { result[n] = perPlayer; });
  });
  return result;
}

// ── Helpers ───────────────────────────────────────────────────

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
}

function formatScore(s) {
  if (s === null || s === undefined) return '—';
  const n = parseInt(s, 10);
  if (isNaN(n)) return s;
  if (n === 0) return 'E';
  return n < 0 ? `${n}` : `+${n}`;
}

function scoreClass(s) {
  if (s === null || s === undefined) return '';
  const n = parseInt(s, 10);
  if (isNaN(n)) return '';
  if (n < 0) return 'under';
  if (n === 0) return 'even';
  return 'over';
}

// ── Dark mode ─────────────────────────────────────────────────

function initDarkMode() {
  const saved = localStorage.getItem('tomp-dark');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'true' || (saved === null && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('tomp-dark', !isDark);
  document.querySelectorAll('.dark-toggle').forEach(btn => {
    btn.textContent = isDark ? '🌙' : '☀️';
  });
}
