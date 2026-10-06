// Shared, in-memory app state. Modules read and mutate this, then re-render.
export const app = {
  user: null,          // signed-in Supabase user, or null for browser-only mode
  session: null,       // the practice session on screen: { id, kind, role, track, tier, jd, resume, sample, completed, qs, state, createdAt }
  sessions: [],        // history list
  stories: [],         // story bank
  progress: { xp: 0, answers: 0, skills: {} },   // XP and skill averages (see game.js)
  bankFilter: null,    // theme name, or null for all
  editingStoryId: null
};

// Per-question status: "upcoming" | "skipped" | "grading" | "reviewed" | "error"
export function newQuestionState(q) {
  return {
    status: "upcoming", answer: "", review: null, error: null, reviewedSample: false, storyId: null, saving: false, saveTags: q.themes || [],
    seconds: null, limit: 0, onTime: false, inputMode: "typed", xp: null
  };
}

export const nextIndex = (s) => s.state.findIndex((x) => x.status === "upcoming");
export const countBy = (s, status) => s.state.filter((x) => x.status === status).length;
