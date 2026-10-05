// Past practice sessions: open one to see its reviews or continue it, or delete it.
import { app, countBy } from "./state.js";
import * as store from "./store.js";
import { $, escapeHtml, avgScore, scoreRing } from "./util.js";

let onOpen = () => {};
let onError = () => {};

export function initHistory(handlers) {
  ({ onOpen, onError } = handlers);
  $("history-list").addEventListener("click", onClick);
}

export function renderHistory() {
  const list = app.sessions;
  $("to-history").hidden = !list.length;
  $("history").hidden = !list.length;
  $("history-sub").textContent = app.user
    ? "Saved to your account."
    : "Saved in this browser only. Sign in to keep your sessions across devices.";
  $("history-list").innerHTML = list.map((s) => {
    const reviewed = s.state.filter((x) => x.status === "reviewed");
    const avg = reviewed.length ? reviewed.reduce((a, x) => a + avgScore(x.review), 0) / reviewed.length : null;
    const answered = s.state.filter((x) => ["reviewed", "grading", "error"].includes(x.status)).length;
    const left = countBy(s, "upcoming") + countBy(s, "skipped");
    const date = new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const onScreen = app.session?.id === s.id;
    return `
      <li class="h-item${onScreen ? " current" : ""}">
        ${avg === null ? `<span class="ring empty"><b>–</b></span>` : scoreRing(avg)}
        <div class="h-main">
          <div class="h-role">${escapeHtml(s.role || "Untitled role")}${s.sample ? ` <span class="chip">Sample</span>` : ""}</div>
          <div class="r-testing">${date} · ${answered} answered${left ? ` · ${left} left` : ""}${onScreen ? " · on screen" : ""}</div>
        </div>
        <div class="actions">
          <button class="ghost small" data-open="${s.id}" type="button">${left ? "Continue" : "Open"}</button>
          <button class="link" data-delete="${s.id}" type="button">Delete</button>
        </div>
      </li>`;
  }).join("");
}

async function onClick(e) {
  const open = e.target.closest("[data-open]");
  if (open) {
    const s = app.sessions.find((x) => x.id === open.dataset.open);
    if (s) onOpen(s);
    return;
  }
  const del = e.target.closest("[data-delete]");
  if (!del) return;
  if (!confirm("Delete this practice session and its reviews? Stories you saved from it stay in your story bank.")) return;
  const id = del.dataset.delete;
  if (app.session?.id === id) app.session.deleted = true;   // stop autosave from re-creating it
  const before = app.sessions;
  app.sessions = app.sessions.filter((x) => x.id !== id);
  renderHistory();
  try {
    await store.deleteSession(id);
  } catch (err) {
    app.sessions = before;
    renderHistory();
    onError(`Couldn't delete that session: ${err.message}`);
  }
}
