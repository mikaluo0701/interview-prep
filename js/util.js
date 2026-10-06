// Small helpers shared by every module.

export const $ = (id) => document.getElementById(id);

export function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const uuid = () => crypto.randomUUID();
export const wordCount = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// First non-empty line of a job description, used as a short role label.
export const roleLabel = (text) => (String(text || "").split("\n").map((l) => l.trim()).find(Boolean) || "").slice(0, 90);

// Seconds as m:ss.
export function fmtTime(seconds) {
  const t = Math.max(0, Math.round(seconds));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export const catLabel = (c) => (c === "technical" ? "Technical" : "Behavioral");

// ---------- Scores ----------

export const clampScore = (n) => Math.min(5, Math.max(1, Math.round(Number(n) || 1)));
export const scoreClass = (n) => (n >= 4 ? "s-good" : n >= 3 ? "s-mid" : "s-low");
export function avgScore(review) {
  const xs = (review?.scores || []).map((c) => clampScore(c.score));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
export const scoreRing = (avg) =>
  `<span class="ring ${scoreClass(avg)}" style="--p:${(avg / 5) * 100}" title="Average ${avg.toFixed(1)} out of 5" aria-label="Average ${avg.toFixed(1)} out of 5"><b>${avg.toFixed(1)}</b></span>`;

export function tagList(tags) {
  return tags && tags.length
    ? `<div class="tag-row r-tags">${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
    : "";
}

// Case-insensitive de-duplication that keeps the first spelling seen.
export function uniqTags(tags) {
  const seen = new Set();
  return tags.map((t) => String(t).trim()).filter((t) => {
    const k = t.toLowerCase();
    if (!t || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// localStorage wrappers that never throw (private windows, blocked storage).
export function readLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}
export function writeLocal(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
