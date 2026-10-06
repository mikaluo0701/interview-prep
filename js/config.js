// Public configuration. The Supabase publishable key is meant to ship to browsers;
// row-level security on the ip_* tables is what protects each user's data.
export const SUPABASE_URL = "https://byjcbrhzozomfwbquebs.supabase.co";
export const SUPABASE_KEY = "sb_publishable_vN2G3-saIdRedCAyOv0_sg_frZXSazB";

export const MODEL = "claude-opus-5-5";

// Behavioral themes every candidate should have a story for.
export const CORE_THEMES = ["Career story", "Conflict", "Ambiguity", "Influence without authority", "Failure", "Leadership", "Ownership", "Prioritization", "Mentoring"];

// MBA recruiting tracks. Technical questions are tailored to the track.
export const TRACKS = [
  { key: "consulting", label: "Consulting" },
  { key: "finance", label: "Finance (IB, PE, VC)" },
  { key: "product", label: "Product management" },
  { key: "marketing", label: "Marketing & brand" },
  { key: "operations", label: "Operations & strategy" },
  { key: "general", label: "General management" }
];

// Limits that match the database CHECK constraints.
export const MAX_DOC_CHARS = 60000;
export const MAX_ANSWER_CHARS = 8000;
// A theme counts as covered once a saved story averaged at least this score.
export const STRONG_SCORE = 4;
