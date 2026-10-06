// Story bank: saved answers tagged by theme, coverage of themes, export/import.
import { app } from "./state.js";
import { CORE_THEMES, STRONG_SCORE } from "./config.js";
import * as store from "./store.js";
import { $, escapeHtml, uuid, catLabel, scoreRing, tagList, uniqTags } from "./util.js";

let onError = () => {};
let onChange = () => {};

export function initBank(handlers) {
  ({ onError, onChange } = handlers);
  $("bank-export").addEventListener("click", exportStories);
  $("bank-import").addEventListener("change", (e) => {
    if (e.target.files[0]) importStories(e.target.files[0]);
    e.target.value = "";
  });
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onTagAddKey);
}

const hasTag = (story, tag) => story.themes.some((t) => t.toLowerCase() === tag.toLowerCase());

export function knownTechTopics() {
  const fromSession = app.session ? app.session.qs.filter((q) => q.category === "technical").flatMap((q) => q.themes || []) : [];
  const fromBank = app.stories.filter((s) => s.category === "technical").flatMap((s) => s.themes);
  return uniqTags([...fromSession, ...fromBank]);
}

// ---------- Tag editor (shared with the review list) ----------

export function tagEditor(category, selected) {
  const base = category === "technical" ? knownTechTopics() : CORE_THEMES;
  const options = uniqTags([...base, ...selected]);
  const isOn = (t) => selected.some((x) => x.toLowerCase() === t.toLowerCase());
  return `
    <div class="tag-row tag-editor">
      ${options.map((t) => `<button type="button" class="tag-opt" aria-pressed="${isOn(t)}">${escapeHtml(t)}</button>`).join("")}
      <input class="tag-add" type="text" placeholder="+ Add tag, Enter" maxlength="40" aria-label="Add a tag">
    </div>`;
}

export function readTags(container) {
  return uniqTags([...container.querySelectorAll('.tag-opt[aria-pressed="true"]')].map((b) => b.textContent));
}

function onTagAddKey(e) {
  if (!e.target.matches("input.tag-add") || e.key !== "Enter") return;
  e.preventDefault();
  const v = e.target.value.trim();
  if (!v) return;
  const row = e.target.closest(".tag-row");
  const existing = [...row.querySelectorAll(".tag-opt")].find((b) => b.textContent.trim().toLowerCase() === v.toLowerCase());
  if (existing) {
    existing.setAttribute("aria-pressed", "true");
  } else {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tag-opt";
    b.setAttribute("aria-pressed", "true");
    b.textContent = v;
    row.insertBefore(b, e.target);
  }
  e.target.value = "";
}

// ---------- Saving ----------

export async function addStory(story) {
  app.stories.push(story);
  renderBank();
  try {
    await store.saveStory(story);
  } catch (err) {
    app.stories = app.stories.filter((s) => s.id !== story.id);
    renderBank();
    onError(`Couldn't save that story: ${err.message}`);
    throw err;
  }
}

// ---------- Rendering ----------

function coverage(themes) {
  return themes.map((theme) => {
    const matches = app.stories.filter((s) => hasTag(s, theme));
    const best = matches.length ? Math.max(...matches.map((s) => s.score)) : null;
    const status = best === null ? "none" : best >= STRONG_SCORE ? "strong" : "weak";
    return { theme, count: matches.length, best, status };
  });
}

// Behavioral themes that don't have a strong story yet, in CORE_THEMES order.
export function storyGaps() {
  return coverage(CORE_THEMES).filter((c) => c.status !== "strong").map((c) => c.theme);
}

function coverageTile(c) {
  const label = c.status === "strong"
    ? `<span class="s-good">Strong · ${c.best.toFixed(1)}</span>`
    : c.status === "weak"
      ? `<span class="s-mid">Needs work · best ${c.best.toFixed(1)}</span>`
      : `<span class="s-low">No story yet</span>`;
  const count = c.count ? ` <span class="muted">· ${c.count} stor${c.count === 1 ? "y" : "ies"}</span>` : "";
  const active = app.bankFilter && app.bankFilter.toLowerCase() === c.theme.toLowerCase();
  return `
    <button type="button" class="cov ${c.status}${active ? " active" : ""}" data-filter="${escapeHtml(c.theme)}">
      <span class="cov-name">${escapeHtml(c.theme)}</span>
      <span class="cov-status">${label}${count}</span>
    </button>`;
}

export function renderBank() {
  const n = app.stories.length;
  $("to-bank").textContent = n ? `Story bank (${n})` : "Story bank";

  const behavioralThemes = uniqTags([...CORE_THEMES, ...app.stories.filter((s) => s.category !== "technical").flatMap((s) => s.themes)]);
  const covB = coverage(behavioralThemes);
  const covT = coverage(knownTechTopics());

  $("cov-b").innerHTML = covB.map(coverageTile).join("");
  $("cov-t").innerHTML = covT.length
    ? covT.map(coverageTile).join("")
    : `<p class="cov-empty">Technical topics appear here once you practice for a role with technical questions, or save a technical story.</p>`;

  const gapsB = covB.filter((c) => c.status !== "strong").map((c) => c.theme);
  const gapsT = covT.filter((c) => c.status !== "strong").map((c) => c.theme);
  const sampleCount = app.stories.filter((s) => s.sample).length;
  const list = (xs) => xs.map(escapeHtml).join(", ");
  let gaps;
  if (!gapsB.length && !gapsT.length) {
    gaps = `<b>You have a strong story for every theme.</b>`;
  } else {
    gaps = `<b>No strong story yet for:</b>`;
    if (gapsB.length) gaps += `<div>Behavioral: ${list(gapsB)}</div>`;
    if (gapsT.length) gaps += `<div>Technical: ${list(gapsT)}</div>`;
  }
  gaps += `<div class="r-testing">A theme counts as strong once a saved story for it averaged ${STRONG_SCORE.toFixed(1)} or higher.${sampleCount ? ` Includes ${sampleCount} sample stor${sampleCount === 1 ? "y" : "ies"}.` : ""}</div>`;
  $("bank-gaps").innerHTML = gaps;

  $("bank-sub").textContent = app.user
    ? `${n} saved stor${n === 1 ? "y" : "ies"} · saved to your account`
    : `${n} saved stor${n === 1 ? "y" : "ies"} · saved in this browser only. Sign in to keep them across devices.`;

  const shown = app.stories
    .filter((s) => !app.bankFilter || hasTag(s, app.bankFilter))
    .sort((a, b) => b.score - a.score || b.savedAt.localeCompare(a.savedAt));

  $("bank-filter").innerHTML = app.bankFilter
    ? `<span>Showing stories tagged <b>${escapeHtml(app.bankFilter)}</b></span><button class="link" data-action="clear-filter" type="button">Show all</button>`
    : n ? `<span>All stories, strongest first. Click a theme above to filter.</span>` : "";

  $("bank-list").innerHTML = shown.length
    ? shown.map(storyCard).join("")
    : `<li class="r upcoming"><span class="cov-empty">${n
        ? "No stories with this tag yet."
        : "No stories yet. After an answer is reviewed, use \"Save to story bank\" to keep it here."}</span></li>`;
}

function storyCard(s) {
  const date = new Date(s.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const meta = [s.role, `saved ${date}`, s.edited ? "edited after review" : ""].filter(Boolean).map(escapeHtml).join(" · ");
  const head = `
    <div class="r-head">
      <span class="pill ${s.category === "technical" ? "technical" : "behavioral"}">${catLabel(s.category)}</span>
      ${s.sample ? `<span class="chip">Sample</span>` : ""}
      <span class="spacer"></span>
      ${scoreRing(s.score)}
    </div>
    <div class="r-q">${escapeHtml(s.question)}</div>
    <div class="r-testing">${meta}</div>`;

  if (app.editingStoryId === s.id) {
    return `
      <li class="r" data-story="${s.id}">
        ${head}
        <div class="story-edit">
          <textarea class="story-answer" aria-label="Story text">${escapeHtml(s.answer)}</textarea>
          ${tagEditor(s.category, s.themes)}
          <div class="actions">
            <button class="primary small" data-action="story-save" data-id="${s.id}" type="button">Save changes</button>
            <button class="ghost small" data-action="story-cancel" type="button">Cancel</button>
          </div>
        </div>
      </li>`;
  }

  return `
    <li class="r" data-story="${s.id}">
      ${head}
      ${tagList(s.themes)}
      <p class="story-text">${escapeHtml(s.answer)}</p>
      ${s.rewrite?.rewrite ? `<div class="story-tip"><b>Coach's stronger sentence:</b> ${escapeHtml(s.rewrite.rewrite)}</div>` : ""}
      <div class="story-actions">
        <button class="link" data-action="story-edit" data-id="${s.id}" type="button">Edit</button>
        <button class="link" data-action="story-delete" data-id="${s.id}" type="button">Delete</button>
      </div>
    </li>`;
}

// ---------- Actions ----------

async function onClick(e) {
  const opt = e.target.closest(".tag-opt");
  if (opt) {
    opt.setAttribute("aria-pressed", String(opt.getAttribute("aria-pressed") !== "true"));
    return;
  }
  const filterBtn = e.target.closest("[data-filter]");
  if (filterBtn) {
    const t = filterBtn.dataset.filter;
    app.bankFilter = app.bankFilter && app.bankFilter.toLowerCase() === t.toLowerCase() ? null : t;
    renderBank();
    return;
  }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  switch (btn.dataset.action) {
    case "clear-filter":
      app.bankFilter = null;
      renderBank();
      break;
    case "story-edit":
      app.editingStoryId = btn.dataset.id;
      renderBank();
      break;
    case "story-cancel":
      app.editingStoryId = null;
      renderBank();
      break;
    case "story-save": {
      const s = app.stories.find((x) => x.id === btn.dataset.id);
      const li = btn.closest("li");
      const answer = li.querySelector(".story-answer").value.trim();
      const tags = readTags(li);
      if (!answer || !tags.length) { alert("A story needs some text and at least one tag."); return; }
      const before = { ...s };
      if (answer !== s.answer) s.edited = true;
      s.answer = answer;
      s.themes = tags;
      app.editingStoryId = null;
      renderBank();
      try {
        await store.saveStory(s);
      } catch (err) {
        Object.assign(s, before);
        renderBank();
        onError(`Couldn't save your changes: ${err.message}`);
      }
      break;
    }
    case "story-delete": {
      if (!confirm("Delete this story from your story bank?")) return;
      const id = btn.dataset.id;
      const removed = app.stories.find((x) => x.id === id);
      app.stories = app.stories.filter((x) => x.id !== id);
      renderBank();
      onChange();
      try {
        await store.deleteStory(id);
      } catch (err) {
        app.stories.push(removed);
        renderBank();
        onChange();
        onError(`Couldn't delete that story: ${err.message}`);
      }
      break;
    }
  }
}

function exportStories() {
  const blob = new Blob([JSON.stringify(app.stories, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `story-bank-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importStories(file) {
  try {
    const incoming = JSON.parse(await file.text());
    if (!Array.isArray(incoming)) throw new Error("not a list");
    const known = new Set(app.stories.map((s) => `${s.question}\n${s.answer}`));
    const fresh = incoming.filter(store.isStory).filter((s) => !known.has(`${s.question}\n${s.answer}`));
    for (const s of fresh) {
      const story = { ...s, id: uuid() };
      await store.saveStory(story);
      app.stories.push(story);
    }
    renderBank();
    $("bank-sub").textContent = `Imported ${fresh.length} new stor${fresh.length === 1 ? "y" : "ies"}.`;
  } catch (err) {
    renderBank();
    onError(err.message === "not a list" ? "That file isn't a story bank export." : `Import stopped: ${err.message}`);
  }
}
