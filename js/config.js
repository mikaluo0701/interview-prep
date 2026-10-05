// Public configuration. The Supabase publishable key is meant to ship to browsers;
// row-level security on the ip_* tables is what protects each user's data.
export const SUPABASE_URL = "https://bkmhdmbwrihbtwwvizvq.supabase.co";
export const SUPABASE_KEY = "sb_publishable_6JfIJ3LenjnMliUCva7qAQ_ab2IA90p";

export const MODEL = "claude-opus-5-5";

// Behavioral themes every candidate should have a story for.
export const CORE_THEMES = ["Conflict", "Ambiguity", "Influence without authority", "Failure", "Leadership", "Ownership", "Prioritization", "Mentoring"];
// A theme counts as covered once a saved story averaged at least this score.
export const STRONG_SCORE = 4;
