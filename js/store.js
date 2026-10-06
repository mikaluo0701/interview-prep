// Accounts and persistence. Signed-in users are stored in Supabase (ip_* tables);
// everyone else gets the same API backed by this browser's localStorage.
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js";
import { readLocal, writeLocal } from "./util.js";
import { emptyProgress, mergeProgress } from "./game.js";

// Pinned so a new upstream release can't change code running next to users' API keys.
const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/+esm";
let supabase = null;     // stays null if the library can't load; the app then runs browser-only

const LOCAL_STORIES = "interview-prep.stories";
const LOCAL_SESSIONS = "interview-prep.sessions";
const LOCAL_PROGRESS = "interview-prep.progress";
const MAX_LOCAL_SESSIONS = 25;

let currentUser = null;
export const user = () => currentUser;

// ---------- Auth ----------

export const authAvailable = () => Boolean(supabase);

export async function initAuth(onChange) {
  try {
    const { createClient } = await import(SUPABASE_JS);
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch {
    return null;
  }
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user ?? null;
  supabase.auth.onAuthStateChange((_event, session) => {
    const next = session?.user ?? null;
    if (next?.id === currentUser?.id) return;
    currentUser = next;
    onChange(currentUser);
  });
  return currentUser;
}

function requireAuth() {
  if (!supabase) throw new Error("Sign-in isn't available right now. Check your connection and reload.");
}

export async function signIn(email, password) {
  requireAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

// Returns true when the account is ready, false when an email confirmation is required first.
export async function signUp(email, password) {
  requireAuth();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return Boolean(data.session);
}

export async function signOut() {
  await supabase?.auth.signOut();
}

// ---------- Row mapping ----------

const storyToRow = (s) => ({
  id: s.id, user_id: currentUser.id, role: s.role || "", category: s.category === "technical" ? "technical" : "behavioral",
  question: s.question, themes: s.themes, answer: s.answer, score: s.score, rewrite: s.rewrite ?? null,
  sample: Boolean(s.sample), edited: Boolean(s.edited), saved_at: s.savedAt, updated_at: new Date().toISOString()
});
const rowToStory = (r) => ({
  id: r.id, role: r.role, category: r.category, question: r.question, themes: r.themes || [], answer: r.answer,
  score: Number(r.score), rewrite: r.rewrite, sample: r.sample, edited: r.edited, savedAt: r.saved_at
});

const sessionToRow = (s) => ({
  id: s.id, user_id: currentUser.id, role: s.role || "", job_description: s.jd, resume: s.resume, sample: Boolean(s.sample),
  kind: s.kind || "interview", track: s.track || "", tier: s.tier || 1, completed: Boolean(s.completed),
  questions: s.qs, state: s.state.map(persistableState), created_at: s.createdAt, updated_at: new Date().toISOString()
});
const rowToSession = (r) => ({
  id: r.id, role: r.role, jd: r.job_description, resume: r.resume, sample: r.sample,
  kind: r.kind || "interview", track: r.track || "", tier: r.tier || 1, completed: Boolean(r.completed),
  qs: r.questions || [], state: (r.state || []).map(restoredState), createdAt: r.created_at, updatedAt: r.updated_at
});
// The browser copy keeps the same fields as the app's session object.
const sessionToLocal = (s) => ({
  id: s.id, role: s.role, jd: s.jd, resume: s.resume, sample: Boolean(s.sample), kind: s.kind || "interview",
  track: s.track || "", tier: s.tier || 1, completed: Boolean(s.completed),
  qs: s.qs, state: s.state.map(persistableState), createdAt: s.createdAt, updatedAt: new Date().toISOString()
});

// Drop UI-only fields before saving.
function persistableState(st) {
  const { saving, ...rest } = st;
  return rest;
}
// A review that was in flight when the page closed can't resume; let the user retry it.
function restoredState(st) {
  return st.status === "grading"
    ? { ...st, status: "error", error: "This review was interrupted. Retry it to get your scores." }
    : { ...st, saving: false };
}

function check({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// ---------- Stories ----------

export async function listStories() {
  if (!currentUser) return readLocal(LOCAL_STORIES, []).filter(isStory);
  return check(await supabase.from("ip_stories").select("*").order("saved_at", { ascending: false })).map(rowToStory);
}

export async function saveStory(story) {
  if (!currentUser) {
    const all = readLocal(LOCAL_STORIES, []).filter((s) => s.id !== story.id);
    all.push(story);
    if (!writeLocal(LOCAL_STORIES, all)) throw new Error("This browser blocked saving. Sign in to keep stories in your account.");
    return;
  }
  check(await supabase.from("ip_stories").upsert(storyToRow(story)));
}

export async function deleteStory(id) {
  if (!currentUser) {
    writeLocal(LOCAL_STORIES, readLocal(LOCAL_STORIES, []).filter((s) => s.id !== id));
    return;
  }
  check(await supabase.from("ip_stories").delete().eq("id", id));
}

export function isStory(s) {
  return s && typeof s.id === "string" && typeof s.question === "string" && typeof s.answer === "string" &&
    Array.isArray(s.themes) && typeof s.score === "number" && typeof s.savedAt === "string";
}

// ---------- Sessions ----------

export async function listSessions() {
  if (!currentUser) {
    return readLocal(LOCAL_SESSIONS, []).map((s) => ({ ...s, state: s.state.map(restoredState) }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return check(await supabase.from("ip_sessions").select("*").order("created_at", { ascending: false }).limit(50)).map(rowToSession);
}

export async function saveSession(session) {
  if (!currentUser) {
    const all = readLocal(LOCAL_SESSIONS, []).filter((s) => s.id !== session.id);
    all.unshift(sessionToLocal(session));
    writeLocal(LOCAL_SESSIONS, all.slice(0, MAX_LOCAL_SESSIONS));
    return;
  }
  check(await supabase.from("ip_sessions").upsert(sessionToRow(session)));
}

export async function deleteSession(id) {
  if (!currentUser) {
    writeLocal(LOCAL_SESSIONS, readLocal(LOCAL_SESSIONS, []).filter((s) => s.id !== id));
    return;
  }
  check(await supabase.from("ip_sessions").delete().eq("id", id));
}

// ---------- Progress (XP and skill averages) ----------

export async function loadProgress() {
  if (!currentUser) return { ...emptyProgress(), ...readLocal(LOCAL_PROGRESS, {}) };
  const row = check(await supabase.from("ip_progress").select("xp, answers, skills").maybeSingle());
  return row ? { xp: row.xp, answers: row.answers, skills: row.skills || {} } : emptyProgress();
}

export async function saveProgress(p) {
  if (!currentUser) {
    writeLocal(LOCAL_PROGRESS, { xp: p.xp, answers: p.answers, skills: p.skills });
    return;
  }
  check(await supabase.from("ip_progress").upsert({
    user_id: currentUser.id, xp: p.xp, answers: p.answers, skills: p.skills, updated_at: new Date().toISOString()
  }));
}

// ---------- Moving browser data into an account ----------

export function localCounts() {
  return {
    stories: readLocal(LOCAL_STORIES, []).filter(isStory).length,
    sessions: readLocal(LOCAL_SESSIONS, []).length,
    xp: readLocal(LOCAL_PROGRESS, {}).xp || 0
  };
}

// Copies this browser's stories, sessions and XP into the signed-in account, then clears them locally.
export async function moveLocalToAccount() {
  if (!currentUser) return;
  const stories = readLocal(LOCAL_STORIES, []).filter(isStory)
    .map((s) => ({ ...s, id: isUuid(s.id) ? s.id : crypto.randomUUID() }));
  const sessions = readLocal(LOCAL_SESSIONS, []);
  if (stories.length) check(await supabase.from("ip_stories").upsert(stories.map(storyToRow)));
  if (sessions.length) check(await supabase.from("ip_sessions").upsert(sessions.map(sessionToRow)));
  const local = readLocal(LOCAL_PROGRESS, null);
  if (local?.answers || local?.xp) await saveProgress(mergeProgress(await loadProgress(), { ...emptyProgress(), ...local }));
  writeLocal(LOCAL_STORIES, null);
  writeLocal(LOCAL_SESSIONS, null);
  writeLocal(LOCAL_PROGRESS, null);
}

const isUuid = (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
