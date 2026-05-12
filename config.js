// ============================================================
//  TRUE OREGONIAN MAJORS POOL — CONFIG
//  This is the ONLY file you need to edit between tournaments.
// ============================================================

const CONFIG = {

  poolName:      "True Oregonian Majors Pool",
  shortName:     "TOMP",

  // ── Supabase ─────────────────────────────────────────────
  // Get these from supabase.com → your project → Settings → API
  supabaseUrl:  "https://sb_publishable_Rf4eCOElfrD3ujjM6s-_1Q_f3pL-RRW.supabase.co",
  supabaseKey:  "sb_secret_JYc8xXq6-XvB2Ufo2jo9rg_AabRNfrh",

  // ── Draft settings ────────────────────────────────────────
  picksPerPlayer: 4,

  // ── Payout percentages (must sum to 100) ─────────────────
  // Standard PGA major payout structure
  payoutPercents: {
     1: 18.00,  2: 10.80,  3:  6.80,  4:  4.80,  5:  4.00,
     6:  3.60,  7:  3.35,  8:  3.10,  9:  2.90, 10:  2.70,
    11:  2.50, 12:  2.30, 13:  2.10, 14:  1.90, 15:  1.80,
    16:  1.70, 17:  1.60, 18:  1.50, 19:  1.40, 20:  1.30,
    21:  1.24, 22:  1.18, 23:  1.12, 24:  1.06, 25:  1.00,
  },

};
