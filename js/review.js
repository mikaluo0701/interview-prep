// Review list: every question in the session with its status, scores, and save-to-bank bar.
import { app, countBy } from "./state.js";
import { STRONG_SCORE } from "./config.js";
import { addStory, tagEditor, readTags } from "./bank.js";
import { $, escapeHtml, uuid, catLabel, clampScore, scoreClass, avgScore, scoreRing, tagList } from "./util.js";

let onRetry = () => {};
let onChange = () => {};

export function initReview(handlers) {
  ({ onRetry, onChange } = handlers);
  $("rlist").addEventListener("click", onClick);
  $("copy").addEventListener("click", copyAsText);
}

export function renderReview() {
  const s = app.session;
  $("review").hidden = !s;
  if (!s) return;
  $("rlist").innerHTML = s.qs.map((_, i) => `<li id="r-${i}"></li>`).join("");
  s.qs.forEach((_, i) => renderReviewItem(i));
  renderReviewSummary();
}

export function renderReviewSummary() {
  const s = app.session;
  if (!s) return;
  const reviewed = s.state.filter((x) => x.status === "reviewed");
  const parts = [];
  if (reviewed.length) {
    const avg = reviewed.reduce((a, x) => a + avgScore(x.review), 0) / reviewed.length;
    parts.push(`${reviewed.length} reviewed · average ${avg.toFixed(1)} / 5`);
  }
  const grading = countBy(s, "grading"), skipped = countBy(s, "skipped"), upcoming = countBy(s, "upcoming");
  if (grading) parts.push(`${grading} being reviewed`);
  if (skipped) parts.push(`${skipped} skipped`);
  if (upcoming) parts.push(`${upcoming} upcoming`);
  $("review-sub").textContent = parts.join(" · ");
}

export function renderReviewItem(i) {
  const li = $(`r-${i}`);
  if (!li || !app.session) return;
  const q = app.session.qs[i], st = app.session.state[i];

  if (st.status === "upcoming") {
    li.className = "r upcoming";
    li.innerHTML = `<div class="r-head"><span class="num">${i + 1}</span><span class="pill ${q.category}">${catLabel(q.category)}</span><span class="spacer"></span><span class="chip">Upcoming</span></div>`;
    return;
  }

  let chip = "", body = "";
  if (st.status === "skipped") {
    chip = `<span class="chip">Skipped</span>`;
  } else if (st.status === "grading") {
    chip = `<span class="chip"><span class="spinner"></span>Reviewing…</span>`;
    body = answerDetails(st.answer, "Your answer");
  } else if (st.status === "error") {
    chip = `<span class="chip s-low">Review failed</span>`;
    body = `
      <div class="r-error"><span>${escapeHtml(st.error)}</span><button class="ghost small" data-retry="${i}" type="button">Retry</button></div>
      ${answerDetails(st.answer, "Your answer")}`;
  } else if (st.status === "reviewed") {
    chip = scoreRing(avgScore(st.review));
    body = reviewBody(i);
  }

  li.className = "r";
  li.innerHTML = `
    <div class="r-head"><span class="num">${i + 1}</span><span class="pill ${q.category}">${catLabel(q.category)}</span><span class="spacer"></span>${chip}</div>
    <div class="r-q">${escapeHtml(q.question)}</div>
    <div class="r-testing">${escapeHtml(q.testing)}</div>
    ${tagList(q.themes)}
    ${body ? `<div class="r-body">${body}</div>` : ""}`;
}

function answerDetails(text, label) {
  return `<details><summary>${escapeHtml(label)}</summary><p>${escapeHtml(text)}</p></details>`;
}

function reviewBody(i) {
  const q = app.session.qs[i], st = app.session.state[i];
  const r = st.review;
  const note = st.reviewedSample
    ? `<div class="r-note"><b>Sample review.</b> No API key was entered, so this reviews the sample answer (shown below), not what you wrote. Add a key to have your own answers reviewed.</div>`
    : "";

  const crit = r.scores.map((c) => {
    const n = clampScore(c.score);
    const dots = [1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? "on" : ""}"></i>`).join("");
    return `
      <div class="crit-row">
        <span class="crit-name">${escapeHtml(c.criterion)}</span>
        <span class="dots ${scoreClass(n)}" aria-label="${n} out of 5">${dots}<b>${n}/5</b></span>
        <span class="crit-just">${escapeHtml(c.justification)}</span>
      </div>`;
  }).join("");

  const list = (items) => items.length
    ? `<ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul>`
    : `<p class="r-testing" style="margin:0">Nothing noted.</p>`;

  const ws = r.weakest_sentence;
  return `
    ${note}
    <div>
      <p class="r-label">Rubric scores</p>
      <div class="crit">${crit}</div>
    </div>
    <div class="two">
      <div><p class="r-label">What worked</p>${list(r.worked)}</div>
      <div><p class="r-label">What was missing</p>${list(r.missing)}</div>
    </div>
    <div>
      <p class="r-label">Stronger version of your weakest sentence</p>
      <div class="rewrite">
        <blockquote class="before"><small>You said</small>${escapeHtml(ws.original)}</blockquote>
        <blockquote class="after"><small>Try</small>${escapeHtml(ws.rewrite)}</blockquote>
      </div>
    </div>
    ${answerDetails(st.reviewedSample ? q.sampleAnswer : st.answer, st.reviewedSample ? "Sample answer that was reviewed" : "Your answer")}
    ${saveBar(i)}`;
}

function saveBar(i) {
  const q = app.session.qs[i], st = app.session.state[i];
  if (st.storyId && app.stories.some((s) => s.id === st.storyId)) {
    return `<div class="save-bar"><span class="saved">✓ Saved to your story bank</span><button class="link" data-action="view-bank" type="button">View story bank</button></div>`;
  }
  if (st.saving) {
    return `
      <div class="save-bar editing">
        <p class="r-label">Tag this story (pick any that apply, or add your own)</p>
        ${tagEditor(q.category, st.saveTags)}
        <div class="actions">
          <button class="primary small" data-action="save-confirm" data-i="${i}" type="button">Save story</button>
          <button class="ghost small" data-action="save-cancel" data-i="${i}" type="button">Cancel</button>
        </div>
      </div>`;
  }
  const strong = avgScore(st.review) >= STRONG_SCORE;
  return `
    <div class="save-bar">
      <span class="save-hint">${strong
        ? "Strong answer. Worth keeping as a go-to story."
        : `Scored below ${STRONG_SCORE.toFixed(1)}. Save it if it's still your best story for this theme, and improve it later.`}</span>
      <button class="${strong ? "primary" : "ghost"} small" data-action="save-open" data-i="${i}" type="button">Save to story bank</button>
    </div>`;
}

async function onClick(e) {
  const retry = e.target.closest("[data-retry]");
  if (retry) { onRetry(Number(retry.dataset.retry)); return; }
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const i = Number(btn.dataset.i);
  const s = app.session;
  switch (btn.dataset.action) {
    case "save-open":
      s.state[i].saving = true;
      renderReviewItem(i);
      break;
    case "save-cancel":
      s.state[i].saving = false;
      renderReviewItem(i);
      break;
    case "save-confirm": {
      const tags = readTags($(`r-${i}`));
      if (!tags.length) { alert("Pick at least one tag so the story shows up under a theme."); return; }
      const q = s.qs[i], st = s.state[i];
      const story = {
        id: uuid(),
        savedAt: new Date().toISOString(),
        role: s.role,
        category: q.category,
        question: q.question,
        themes: tags,
        answer: st.reviewedSample ? q.sampleAnswer : st.answer,
        score: Math.round(avgScore(st.review) * 10) / 10,
        rewrite: st.review.weakest_sentence,
        sample: s.sample,
        edited: false
      };
      st.saveTags = tags;
      st.saving = false;
      st.storyId = story.id;
      const saving = addStory(story);   // adds to the bank right away, then saves
      renderReviewItem(i);
      try {
        await saving;
        onChange();
      } catch {
        st.storyId = null;
        renderReviewItem(i);
      }
      break;
    }
    case "view-bank":
      $("bank").scrollIntoView({ behavior: "smooth", block: "start" });
      break;
  }
}

function asPlainText() {
  const s = app.session;
  const lines = [];
  s.qs.forEach((q, i) => {
    const st = s.state[i];
    lines.push(`${i + 1}. [${catLabel(q.category)}] ${q.question}`);
    if (st.status === "upcoming") lines.push("   (not answered yet)");
    else if (st.status === "skipped") lines.push("   (skipped)");
    else {
      lines.push("", "   Answer:", ...st.answer.split("\n").map((l) => `   ${l}`));
      if (st.status === "reviewed") {
        const r = st.review;
        lines.push("", `   Score: ${avgScore(r).toFixed(1)} / 5`);
        r.scores.forEach((c) => lines.push(`   - ${c.criterion}: ${clampScore(c.score)}/5 — ${c.justification}`));
        lines.push("", "   What worked:", ...r.worked.map((x) => `   - ${x}`));
        lines.push("", "   What was missing:", ...r.missing.map((x) => `   - ${x}`));
        lines.push("", `   Weakest sentence: ${r.weakest_sentence.original}`, `   Stronger: ${r.weakest_sentence.rewrite}`);
      }
    }
    lines.push("");
  });
  return lines.join("\n").trim();
}

async function copyAsText() {
  if (!app.session) return;
  const btn = $("copy");
  try {
    await navigator.clipboard.writeText(asPlainText());
    btn.textContent = "Copied";
  } catch {
    btn.textContent = "Copy failed";
  }
  setTimeout(() => (btn.textContent = "Copy as text"), 1500);
}
