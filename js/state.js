// Shared, in-memory app state. Modules read and mutate this, then re-render.
export const app = {
  user: null,          // signed-in Supabase user, or null for browser-only mode
  session: null,       // the practice session on screen: { id, role, jd, resume, sample, qs, state, createdAt }
  sessions: [],        // history list
  stories: [],         // story bank
  bankFilter: null,    // theme name, or null for all
  editingStoryId: null
};

// Per-question status: "upcoming" | "skipped" | "grading" | "reviewed" | "error"
export function newQuestionState(q) {
  return { status: "upcoming", answer: "", review: null, error: null, reviewedSample: false, storyId: null, saving: false, saveTags: q.themes || [] };
}

export const nextIndex = (s) => s.state.findIndex((x) => x.status === "upcoming");
export const countBy = (s, status) => s.state.filter((x) => x.status === status).length;
