// Main flow: feed Nibbles a job + résumé, it turns evil and interviews you, reviews come in,
// and every graded answer earns XP toward the next level.
import { app, newQuestionState, nextIndex, countBy } from "./state.js";
import * as store from "./store.js";
import { generateQuestions, generateDrill, reviewAnswer, fetchJobFromUrl, transcribePdf } from "./claude.js";
import { extractPdfText, fileToBase64, MAX_PDF_BYTES } from "./pdf.js";
import { createMonster } from "./monster.js";
import { initReview, renderReview, renderReviewItem, renderReviewSummary } from "./review.js";
import { initBank, renderBank, storyGaps } from "./bank.js";
import { initHistory, renderHistory } from "./history.js";
import { speechSupported, createDictation, createTimer } from "./voice.js";
import { levelInfo, answerXp, updateSkills, weakestSkills, emptyProgress, COMPLETION_XP, DRILL_UNLOCK_ANSWERS } from "./game.js";
import { TRACKS, MAX_DOC_CHARS } from "./config.js";
import { SAMPLE_JD, SAMPLE_RESUME, SAMPLE_OUTPUT } from "./sample.js";
import { $, escapeHtml, sleep, uuid, wordCount, pick, debounce, roleLabel, catLabel, avgScore, reducedMotion, fmtTime } from "./util.js";

const KEY_STORAGE = "interview-prep.apiKey";
const TIMER_STORAGE = "interview-prep.timer";
const stage = $("stage");
const monster = createMonster($("monster"), $("bubble"));

const food = {
  jd: { mode: "text", text: "", fed: false },
  resume: { mode: "text", text: "", fed: false, pdf: null }   // pdf: { name, pages, text }
};

const LINES = {
  intro: "Hi, I'm Nibbles! 👋 Feed me a job description and your résumé, and I'll turn them into MBA interview practice. Every answer earns XP.",
  hungryAgain: "Hungry again! 🍽 What are we practicing for next?",
  bothFed: "Yum, all fed! 🍽 Press “Start the interview” when you're ready… I promise I'm nice. 😇",
  transform: "MWAHAHA! 😈 You fed me well. Now… I ask the questions.",
  drillTransform: "Your weak spots look DELICIOUS. 😈 Three questions. No mercy.",
  sharpening: "Sharpening my questions… 🔪",
  finished: "Phew… you survived! 💙 Your reviews are below. Save the good ones to your story bank.",
  backForMore: "Back for more? Excellent. 😈",
  needKey: "To interview you on YOUR materials I need an API key 🔑 (about $0.50 an interview). Add one below, or try my sample interview first.",
  intros: ["Answer carefully.", "Don't bore me.", "Let's see you squirm.", "Take your time. I'm patient… for now.", "This one's tasty.", "No pressure. Heh."],
  submitted: ["Noted. I'll be judging that.", "Hmm. Interesting choice of words.", "Moving on… for now.", "I'll remember that one.", "Writing that down. In red ink."],
  skipped: ["Running away? I'll remember that.", "Skipping? Coward. Fine.", "Saving that one for later, are we?"],
  timeUp: ["Time's up! ⏰ Wrap it up.", "Tick tock. ⏰ Interviewers stop listening after two minutes.", "Over time! ⏰ Land the plane."],
  high: ["Hmph. That was… actually good.", "Grr. I couldn't find much wrong with that.", "Lucky answer. Don't get cocky."],
  mid: ["Passable. Barely.", "Not terrible. Not great.", "I've heard worse. I've heard better."],
  low: ["Weak! Read my notes below.", "Was that an answer or a shrug?", "Ouch. My notes are waiting for you."]
};

// ---------- Small UI helpers ----------

function showNotice(kind, html) {
  const n = $("notice");
  n.className = `notice ${kind}`;
  n.innerHTML = html;
  n.hidden = false;
}
const hideNotice = () => ($("notice").hidden = true);
const showError = (msg) => showNotice("err", escapeHtml(msg));

function setMode(mode) {
  stage.dataset.mode = mode;
  $("feed").hidden = mode !== "feed";
  $("interview").hidden = mode !== "interview";
  $("done").hidden = mode !== "done";
  if (mode !== "interview") stopAnswering();
}

function setBusy(btn, label) {
  btn.dataset.label ??= btn.textContent;
  btn.disabled = Boolean(label);
  btn.innerHTML = label ? `<span class="spinner"></span>${escapeHtml(label)}` : escapeHtml(btn.dataset.label);
}

const getKey = () => $("key").value.trim();

function updateKeyStatus() {
  $("key-status").textContent = getKey() ? "Key added" : "Sample mode";
  $("key-panel").classList.toggle("has-key", Boolean(getKey()));
  renderXp();
}

function saveKeyPreference() {
  try {
    if ($("remember").checked && getKey()) localStorage.setItem(KEY_STORAGE, getKey());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {}
}

function openKeyHelp() {
  $("key-panel").open = true;
  $("key-help").open = true;
  $("key-panel").scrollIntoView({ behavior: "smooth", block: "center" });
}

// Throws a little emoji "food" from a button into Nibbles' mouth.
async function flyToMonster(fromEl, emoji) {
  if (reducedMotion()) return;
  const from = fromEl.getBoundingClientRect();
  const to = $("monster").getBoundingClientRect();
  const el = document.createElement("span");
  el.className = "flyer";
  el.textContent = emoji;
  el.style.left = `${from.left + from.width / 2}px`;
  el.style.top = `${from.top + from.height / 2}px`;
  document.body.appendChild(el);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height * 0.66 - (from.top + from.height / 2);
  await el.animate(
    [
      { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 90}px)) scale(1.15) rotate(-20deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3) rotate(10deg)`, opacity: 0.2 }
    ],
    { duration: 700, easing: "cubic-bezier(.45,0,.55,1)" }
  ).finished.catch(() => {});
  el.remove();
}

// ---------- XP, levels, drills ----------

const currentLevel = () => levelInfo(app.progress.xp);

const saveProgressSoon = debounce(async () => {
  try {
    await store.saveProgress(app.progress);
  } catch (err) {
    showError(`Couldn't save your XP: ${err.message}`);
  }
}, 800);

function renderXp() {
  const info = currentLevel();
  $("xp-level").textContent = `Lv ${info.level}`;
  $("xp-title").textContent = info.title;
  $("xp-fill").style.width = `${Math.min(100, (info.into / info.span) * 100)}%`;
  $("xp").title = `${info.xp} XP · ${info.toNext} XP to Level ${info.level + 1} · Nibbles is your ${info.tier.name}` +
    (getKey() ? "" : " · Add your API key to start earning XP");
  monster.setTier(info.tier.tier);
  if (stage.dataset.mode === "feed") $("rank").textContent = `😈 ${info.tier.name} Nibbles`;
}

function addXp(amount) {
  if (!amount) return;
  const before = currentLevel();
  app.progress.xp += amount;
  const after = currentLevel();
  renderXp();
  const badge = $("xp");
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");
  saveProgressSoon();
  if (after.level > before.level) levelUp(after, after.tier.tier > before.tier.tier);
}

let levelupTimer;
function levelUp(info, promoted) {
  $("levelup-title").textContent = `Level ${info.level}: ${info.title}`;
  $("levelup-sub").textContent = promoted
    ? `Nibbles got promoted to ${info.tier.name}. Its questions just got sharper. 😈`
    : `${info.toNext} XP to Level ${info.level + 1}.`;
  $("levelup").hidden = false;
  monster.celebrate();
  confetti();
  clearTimeout(levelupTimer);
  levelupTimer = setTimeout(() => ($("levelup").hidden = true), 3800);
}

function confetti() {
  if (reducedMotion()) return;
  const colors = ["#0457cb", "#ff3d6e", "#f0c060", "#6fd09c", "#a9b8ec"];
  for (let k = 0; k < 40; k++) {
    const c = document.createElement("span");
    c.className = "confetti";
    c.style.left = `${Math.random() * 100}vw`;
    c.style.background = colors[k % colors.length];
    c.style.animationDuration = `${1.6 + Math.random() * 1.6}s`;
    c.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(c);
    c.addEventListener("animationend", () => c.remove(), { once: true });
  }
}

function renderDrill() {
  const p = app.progress;
  const weak = weakestSkills(p.skills);
  const locked = p.answers < DRILL_UNLOCK_ANSWERS || weak.length < 2;
  $("drill").hidden = false;
  $("drill").classList.toggle("locked", locked);
  $("start-drill").hidden = locked;
  $("drill-sub").textContent = locked
    ? `Answer ${DRILL_UNLOCK_ANSWERS} questions with your API key to unlock drills on your weakest skills (${Math.min(p.answers, DRILL_UNLOCK_ANSWERS)}/${DRILL_UNLOCK_ANSWERS}).`
    : `Weakest: ${weak.map((w) => `${w.label} ${w.value.toFixed(1)}`).join(" · ")}. 3 questions to work on them.`;
}

// Drills are tailored to the materials on the table, or the latest real session.
function latestMaterials() {
  const fedOwn = food.jd.fed && food.resume.fed && food.jd.text !== SAMPLE_JD;
  if (fedOwn) return { jd: food.jd.text, resume: food.resume.text };
  const last = app.sessions.find((s) => !s.sample && s.jd);
  return last ? { jd: last.jd, resume: last.resume } : { jd: "", resume: "" };
}

// ---------- Feeding ----------

function renderFood() {
  for (const kind of ["jd", "resume"]) {
    const f = food[kind];
    const card = $(`food-${kind}`);
    card.classList.toggle("fed", f.fed);
    $(`plate-${kind}`).classList.toggle("full", f.fed);
    card.querySelectorAll("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === f.mode)));
    card.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== f.mode));
  }
  const words = (t) => `${wordCount(t)} words`;
  $("fed-jd").textContent = food.jd.fed ? `${roleLabel(food.jd.text) || "Job description"} · ${words(food.jd.text)}` : "";
  $("fed-resume").textContent = food.resume.fed
    ? (food.resume.mode === "pdf" && food.resume.pdf ? `${food.resume.pdf.name} · ${words(food.resume.text)}` : `Résumé · ${words(food.resume.text)}`)
    : "";
  $("jd-count").textContent = $("jd").value.trim() ? words($("jd").value) : "";
  $("resume-count").textContent = $("resume").value.trim() ? words($("resume").value) : "";
  const ready = food.jd.fed && food.resume.fed;
  $("start").disabled = !ready;
  $("start-hint").textContent = ready ? "" : `Still hungry for: ${[!food.jd.fed && "a job description", !food.resume.fed && "a résumé"].filter(Boolean).join(" and ")}`;
}

async function eat(kind, fromEl) {
  await flyToMonster(fromEl, kind === "jd" ? "📋" : "📄");
  monster.gulp();
  monster.say(kind === "jd" ? "Om nom nom…" : "Munch munch…", { face: "chew" });
  await sleep(reducedMotion() ? 200 : 1100);
  food[kind].fed = true;
  renderFood();
  const role = roleLabel(food.jd.text);
  if (food.jd.fed && food.resume.fed) {
    monster.say(LINES.bothFed, { face: "happy" });
  } else if (kind === "jd") {
    monster.say(`Mmm, ${role && role.length < 60 ? role : "a juicy job"}! Crunchy. 😋 Now your résumé, please.`, { face: "happy" });
  } else {
    monster.say("Tasty résumé! 😋 Now a job description to go with it.", { face: "happy" });
  }
}

const complain = (text) => monster.say(text, { face: "shocked", settle: "normal" });
const tooLong = (text) => text.length > MAX_DOC_CHARS;

async function feedJd() {
  const btn = $("feed-jd");
  let text;
  if (food.jd.mode === "url") {
    const url = $("jd-url").value.trim();
    if (!/^https?:\/\/[^\s.]+\.\S+/i.test(url)) return complain("That doesn't look like a link. It should start with https://");
    if (!getKey()) {
      openKeyHelp();
      return complain("I can only read links with an API key 🔑. Add one below, or paste the job text instead.");
    }
    setBusy(btn, "Reading the page…");
    monster.say("Ooh, a link! Let me go fetch it… 🏃", { face: "happy" });
    try {
      text = await fetchJobFromUrl(getKey(), url);
      $("jd").value = text;
    } catch (err) {
      return complain(`I couldn't read that page: ${err.message} Try pasting the job text instead.`);
    } finally {
      setBusy(btn, null);
    }
  } else {
    text = $("jd").value.trim();
    if (wordCount(text) < 15) return complain("That's barely a crumb! Paste the full job description, at least a few sentences.");
  }
  if (tooLong(text)) return complain("That's a feast! Keep the job description under 60,000 characters.");
  food.jd.text = text;
  await eat("jd", btn);
}

async function feedResume(fromEl = $("feed-resume")) {
  let text;
  if (food.resume.mode === "pdf") {
    if (!food.resume.pdf) return complain("Pick a PDF first, or drop one right into my mouth! 👄");
    text = food.resume.pdf.text;
  } else {
    text = $("resume").value.trim();
    if (wordCount(text) < 30) return complain("That résumé is a bit thin! Paste the whole thing.");
  }
  if (tooLong(text)) return complain("That résumé is a feast! Keep it under 60,000 characters.");
  food.resume.text = text;
  await eat("resume", fromEl);
}

async function readPdf(file) {
  const status = $("pdf-status");
  const fail = (msg) => {
    food.resume.pdf = null;
    status.className = "pdf-status err";
    status.textContent = msg;
    return false;
  };
  if (!file) return false;
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return fail("That isn't a PDF. Upload a .pdf file, or paste your résumé as text.");
  if (file.size > MAX_PDF_BYTES) return fail("That PDF is over 10 MB. Try a smaller export.");

  food.resume.mode = "pdf";
  renderFood();
  status.className = "pdf-status";
  status.innerHTML = `<span class="spinner"></span>Reading ${escapeHtml(file.name)}…`;
  try {
    let { text, pages } = await extractPdfText(file);
    if (wordCount(text) < 30) {
      if (!getKey()) {
        openKeyHelp();
        return fail("This PDF looks like a scanned image, so there's no text to read. Add an API key and Claude will read it, or paste the text instead.");
      }
      status.innerHTML = `<span class="spinner"></span>Scanned PDF. Asking Claude to read it…`;
      text = await transcribePdf(getKey(), await fileToBase64(file));
    }
    food.resume.pdf = { name: file.name, pages, text };
    $("resume").value = text;
    status.className = "pdf-status ok";
    status.textContent = `✓ ${file.name} · ${pages} page${pages === 1 ? "" : "s"} · ${wordCount(text)} words`;
    renderFood();
    return true;
  } catch (err) {
    return fail(`Couldn't read that PDF: ${err.message}`);
  }
}

async function feedSample() {
  hideNotice();
  food.jd.mode = "text";
  food.resume.mode = "text";
  $("jd").value = SAMPLE_JD;
  $("resume").value = SAMPLE_RESUME;
  food.jd.text = SAMPLE_JD;
  food.resume.text = SAMPLE_RESUME;
  renderFood();
  if (!food.jd.fed) await eat("jd", $("sample-food"));
  if (!food.resume.fed) await eat("resume", $("sample-food"));
}

function unfeed(kind) {
  food[kind].fed = false;
  renderFood();
  monster.say(`Changed your mind? Okay, feed me a different ${kind === "jd" ? "job description" : "résumé"}.`, { face: "normal" });
}

// ---------- Answering: timer and voice ----------

let answerMode = "typed";
let timeUpShown = false;

const timer = createTimer((elapsed, limit) => {
  const el = $("timer");
  el.textContent = limit ? `⏱ ${fmtTime(elapsed)} / ${fmtTime(limit)}` : `⏱ ${fmtTime(elapsed)}`;
  el.classList.toggle("warn", Boolean(limit) && elapsed >= limit - 15 && elapsed < limit);
  el.classList.toggle("over", Boolean(limit) && elapsed >= limit);
  if (limit && elapsed >= limit && !timeUpShown && stage.dataset.mode === "interview") {
    timeUpShown = true;
    showReaction(pick(LINES.timeUp), "s-low", "smug");
  }
});

const dictation = createDictation($("answer"), {
  onChange: (on) => {
    $("mic").classList.toggle("listening", on);
    $("mic").textContent = on ? "● Listening… tap to stop" : "🎤 Speak";
    if (on) answerMode = "spoken";
  },
  onError: (msg) => showReaction(msg, "s-low")
});

function stopAnswering() {
  dictation.stop();
  const seconds = timer.stop();
  $("timer").textContent = "";
  return seconds;
}

// ---------- Interview and drill runs ----------

let busy = false;

async function startRun(kind, { forceSample = false } = {}) {
  if (busy) return;
  const key = getKey();
  if (kind === "interview" && (!food.jd.fed || !food.resume.fed)) return;
  if (kind === "drill" && !key) {
    openKeyHelp();
    return complain("Drills need your API key 🔑 so I can grade your real answers.");
  }
  const ownFood = food.jd.text !== SAMPLE_JD || food.resume.text !== SAMPLE_RESUME;
  if (kind === "interview" && !key && ownFood && !forceSample) {
    openKeyHelp();
    showNotice("warn", `<b>Add your API key to practice on your own materials.</b> Without one, Nibbles can only run its sample interview. <button class="link" id="sample-anyway" type="button">Try the sample interview instead</button>`);
    $("sample-anyway").addEventListener("click", () => startRun("interview", { forceSample: true }), { once: true });
    return complain(LINES.needKey);
  }

  busy = true;
  hideNotice();
  saveKeyPreference();
  const tier = currentLevel().tier;
  setMode("generating");
  $("rank").textContent = `😈 ${tier.name} Nibbles`;
  $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
  await monster.transform("evil");
  await monster.say(kind === "drill" ? LINES.drillTransform : LINES.transform, { face: "talk", settle: "normal" });
  await sleep(900);

  const sample = kind === "interview" && !key;
  let output, jd, resume, role;
  monster.say(LINES.sharpening, { face: "smug" });
  try {
    if (sample) {
      await sleep(900);
      output = SAMPLE_OUTPUT;
      [jd, resume] = [SAMPLE_JD, SAMPLE_RESUME];
      role = roleLabel(jd);
      showNotice("warn", "<b>Sample mode.</b> These are sample questions for a sample Product Manager role. Each one has a sample answer you can insert and a pre-written review. Sample answers don't earn XP: add your API key to practice on your own materials.");
    } else if (kind === "drill") {
      ({ jd, resume } = latestMaterials());
      const weak = weakestSkills(app.progress.skills);
      output = await generateDrill(key, { jd, resume, weakSkills: weak, gapThemes: storyGaps().slice(0, 2), interviewer: tier.name });
      role = `Weak-spot drill · ${weak.map((w) => w.label).join(" & ")}`;
    } else {
      [jd, resume] = [food.jd.text, food.resume.text];
      output = await generateQuestions(key, { jd, resume, track: $("track").value, interviewer: tier.name });
      role = roleLabel(jd);
    }
  } catch (err) {
    busy = false;
    setMode("feed");
    await monster.transform("cute");
    renderXp();
    complain(`Oops, my brain glitched: ${err.message}`);
    return;
  }

  const qs = [
    ...(output.behavioral || []).map((q) => ({ ...q, category: "behavioral" })),
    ...(output.technical || []).map((q) => ({ ...q, category: "technical" }))
  ];
  app.session = {
    id: uuid(), createdAt: new Date().toISOString(), kind, track: output.track || "", tier: tier.tier,
    role, jd, resume, sample, completed: false, qs, state: qs.map(newQuestionState)
  };
  await persistNow();
  renderReview();
  renderBank();
  setMode("interview");
  busy = false;
  askNext();
}

function askNext() {
  const s = app.session;
  const i = nextIndex(s);
  if (i === -1) return finish();
  const q = s.qs[i];
  const n = s.qs.length;
  app.current = i;
  const handled = s.state.filter((x) => x.status !== "upcoming").length;

  $("q-meta").innerHTML = `Question ${i + 1} of ${n} <span class="pill ${q.category}">${catLabel(q.category)}</span>`;
  $("q-done").textContent = `${handled} of ${n} done`;
  $("segs").innerHTML = s.state.map((x, k) =>
    `<span class="seg ${k === i ? "current" : x.status === "upcoming" ? "" : x.status === "skipped" ? "skipped" : "done"}"></span>`).join("");
  $("q-hint").textContent = q.testing;
  $("hint").open = false;
  $("answer").value = "";
  $("use-sample-answer").hidden = !s.sample;
  answerMode = "typed";
  timeUpShown = false;
  dictation.stop();
  timer.start(Number($("timer-limit").value));
  syncAnswer();
  monster.say(q.question, { sub: `Question ${i + 1} of ${n} · ${pick(LINES.intros)}`, face: "talk", settle: "normal" });
  $("answer").focus({ preventScroll: true });
}

function syncAnswer() {
  const w = wordCount($("answer").value);
  $("answer-count").textContent = w ? `${w} words` : "";
  $("submit").disabled = !w || busy;
  $("skip").disabled = busy;
}

async function submitAnswer() {
  const i = app.current;
  const text = $("answer").value.trim();
  if (busy || !text || i == null) return;
  busy = true;
  const limit = timer.limit;
  const seconds = stopAnswering();
  const st = app.session.state[i];
  Object.assign(st, {
    answer: text, status: "grading", seconds: Math.round(seconds), limit,
    onTime: Boolean(limit) && seconds <= limit, inputMode: answerMode
  });
  syncAnswer();
  persist();
  renderReviewItem(i);
  renderReviewSummary();
  grade(i);
  await monster.say(pick(LINES.submitted), { face: "smug" });
  await sleep(700);
  busy = false;
  askNext();
}

async function skipQuestion() {
  const i = app.current;
  if (busy || i == null) return;
  busy = true;
  stopAnswering();
  app.session.state[i].status = "skipped";
  syncAnswer();
  persist();
  renderReviewItem(i);
  renderReviewSummary();
  await monster.say(pick(LINES.skipped), { face: "smug" });
  await sleep(600);
  busy = false;
  askNext();
}

async function grade(i) {
  const s = app.session, st = s.state[i], q = s.qs[i];
  st.status = "grading";
  st.error = null;
  renderReviewItem(i);
  try {
    let review;
    if (s.sample) {
      await sleep(900);
      review = q.sampleReview;
      st.reviewedSample = st.answer.trim() !== q.sampleAnswer.trim();
    } else {
      review = await reviewAnswer(getKey(), s, q, st);
    }
    if (app.session !== s) return;
    st.review = review;
    st.status = "reviewed";
    // XP and skill tracking: real answers only, once per answer (a retried review doesn't pay twice).
    if (!s.sample && st.xp == null) {
      st.xp = answerXp(avgScore(review), s.tier || 1, st.onTime);
      app.progress.answers += 1;
      app.progress.skills = updateSkills(app.progress.skills, review.skills);
      addXp(st.xp);
      renderDrill();
    }
  } catch (err) {
    if (app.session !== s) return;
    st.error = err.message;
    st.status = "error";
  }
  persist();
  renderReviewItem(i);
  renderReviewSummary();
  if (stage.dataset.mode === "done") renderDone();
  react(i);
}

// Nibbles' running commentary, shown under the bubble so it never interrupts the current question.
let reactionTimer;
function showReaction(line, cls, face) {
  const el = $("reaction");
  el.className = `reaction show ${cls}`;
  el.textContent = line;
  if (face) {
    monster.setFace(face);
    setTimeout(() => monster.form === "evil" && monster.setFace("normal"), 1600);
  }
  clearTimeout(reactionTimer);
  reactionTimer = setTimeout(() => el.classList.remove("show"), 5000);
}

function react(i) {
  if (stage.dataset.mode !== "interview") return;
  const s = app.session, st = s.state[i];
  if (st.status === "error") return showReaction(`My review of Q${i + 1} failed. Retry it in the list below.`, "s-low");
  const avg = avgScore(st.review);
  const [line, cls, face] = avg >= 4 ? [pick(LINES.high), "s-good", "shocked"] : avg >= 3 ? [pick(LINES.mid), "s-mid", "smug"] : [pick(LINES.low), "s-low", "smug"];
  const xp = s.sample ? " · sample, no XP" : st.xp ? ` · +${st.xp} XP` : "";
  showReaction(`Q${i + 1} · ${avg.toFixed(1)}/5${xp} · ${line}`, cls, face);
}

async function finish() {
  app.current = null;
  const s = app.session;
  // Completion bonus for answering every question without skipping.
  if (!s.sample && !s.completed && countBy(s, "skipped") === 0 && countBy(s, "upcoming") === 0) {
    s.completed = true;
    addXp(COMPLETION_XP[s.kind] ?? COMPLETION_XP.interview);
    persist();
  }
  setMode("done");
  renderDone();
  $("reaction").classList.remove("show");
  if (monster.form === "evil") await monster.transform("cute");
  renderXp();
  monster.say(LINES.finished, { face: "happy" });
}

function renderDone() {
  const s = app.session;
  const n = s.qs.length;
  const left = countBy(s, "upcoming") + countBy(s, "skipped");
  const answered = n - left;
  $("done-title").textContent = left ? "Taking a break?" : s.kind === "drill" ? "Drill complete" : "Interview over";
  $("done-text").textContent = left
    ? `You've answered ${answered} of ${n}. ${left} question${left === 1 ? " is" : "s are"} still waiting.`
    : `You answered all ${n} questions. Your reviews are below.`;
  $("continue").hidden = !left;
  $("continue").textContent = `Continue (${left} left)`;
  if (s.sample) {
    $("done-xp").textContent = "Sample answers don't earn XP. Add your API key to start earning XP.";
  } else {
    const bonus = s.completed ? COMPLETION_XP[s.kind] ?? COMPLETION_XP.interview : 0;
    const earned = s.state.reduce((a, x) => a + (x.xp || 0), 0) + bonus;
    const info = currentLevel();
    $("done-xp").textContent = `+${earned} XP this session${bonus ? ` (including +${bonus} for finishing)` : ""} · Level ${info.level} ${info.title} · ${info.toNext} XP to Level ${info.level + 1}`;
  }
}

async function continueInterview() {
  const s = app.session;
  s.state.forEach((x) => { if (x.status === "skipped") x.status = "upcoming"; });
  persist();
  renderReview();
  setMode("interview");
  $("rank").textContent = `😈 ${currentLevel().tier.name} Nibbles`;
  await monster.transform("evil");
  await monster.say(LINES.backForMore, { face: "talk", settle: "normal" });
  await sleep(500);
  askNext();
}

function feedNewFood() {
  hideNotice();
  food.jd.fed = false;
  food.resume.fed = false;
  renderFood();
  setMode("feed");
  renderXp();
  monster.say(LINES.hungryAgain, { face: "happy" });
  $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function openSession(s) {
  if (busy) return;
  hideNotice();
  app.session = s;
  if (s.kind !== "drill") {
    food.jd = { mode: "text", text: s.jd, fed: true };
    food.resume = { mode: "text", text: s.resume, fed: true, pdf: null };
    $("jd").value = s.jd;
    $("resume").value = s.resume;
  }
  renderFood();
  renderReview();
  renderBank();
  renderHistory();
  setMode("done");
  renderDone();
  if (monster.form === "evil") await monster.transform("cute");
  monster.say(`Welcome back! Here's your ${s.kind === "drill" ? "drill" : "session"} for ${s.role || "that role"}. 📚`, { face: "happy" });
  $("stage").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Persistence ----------

async function persistNow() {
  const s = app.session;
  if (!s || s.deleted) return;
  try {
    await store.saveSession(s);
  } catch (err) {
    showError(`Couldn't save your progress: ${err.message}`);
    return;
  }
  const at = app.sessions.findIndex((x) => x.id === s.id);
  if (at === -1) app.sessions.unshift(s); else app.sessions[at] = s;
  renderHistory();
}
const persist = debounce(persistNow, 600);

async function loadData() {
  try {
    [app.stories, app.sessions] = await Promise.all([store.listStories(), store.listSessions()]);
  } catch (err) {
    app.stories = [];
    app.sessions = [];
    showError(`Couldn't load your saved data: ${err.message}`);
  }
  try {
    app.progress = await store.loadProgress();
  } catch (err) {
    app.progress = emptyProgress();
    showError(`Couldn't load your XP: ${err.message}`);
  }
  // Keep the on-screen session object so in-flight reviews still land in it.
  if (app.session) {
    const at = app.sessions.findIndex((x) => x.id === app.session.id);
    if (at !== -1) app.sessions[at] = app.session;
  }
  renderXp();
  renderDrill();
  renderBank();
  renderHistory();
  renderReview();
  renderMoveBanner();
}

// ---------- Accounts ----------

let moveDismissed = false;

function renderAuth() {
  const u = app.user;
  $("auth-btn").hidden = Boolean(u) || !store.authAvailable();
  $("account").hidden = !u;
  $("account-email").textContent = u?.email || "";
  $("account-menu").hidden = true;
}

function renderMoveBanner() {
  const { stories, sessions, xp } = store.localCounts();
  const show = Boolean(app.user) && !moveDismissed && Boolean(stories || sessions || xp);
  $("move-banner").hidden = !show;
  if (!show) return;
  const parts = [
    stories && `${stories} stor${stories === 1 ? "y" : "ies"}`,
    sessions && `${sessions} practice session${sessions === 1 ? "" : "s"}`,
    xp && `${xp} XP`
  ].filter(Boolean);
  $("move-text").textContent = `This browser has ${parts.join(", ")} saved from before you signed in. Move them into your account?`;
}

async function onAuthChange(user) {
  const wasSignedIn = Boolean(app.user);
  app.user = user;
  renderAuth();
  if (!user && wasSignedIn) {
    // Don't leave the signed-out account's session on screen or copy it into this browser.
    app.session = null;
    app.current = null;
    busy = false;
    feedNewFood();
    if (monster.form === "evil") await monster.transform("cute");
    monster.say("Signed out. See you next time! 👋", { face: "happy" });
  } else if (user && app.session) {
    await persistNow();   // a session started before signing in moves into the account
  }
  await loadData();
}

function openAuth(mode) {
  const d = $("auth-dialog");
  d.dataset.mode = mode;
  $("auth-title").textContent = mode === "signup" ? "Create your account" : "Sign in";
  $("auth-submit").textContent = mode === "signup" ? "Create account" : "Sign in";
  $("auth-switch-text").textContent = mode === "signup" ? "Already have an account?" : "New here?";
  $("auth-switch").textContent = mode === "signup" ? "Sign in" : "Create an account";
  $("auth-password").autocomplete = mode === "signup" ? "new-password" : "current-password";
  $("auth-error").hidden = true;
  if (!d.open) d.showModal();
  $("auth-email").focus();
}

async function submitAuth(e) {
  e.preventDefault();
  const d = $("auth-dialog");
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  const err = $("auth-error");
  err.hidden = true;
  const btn = $("auth-submit");
  setBusy(btn, d.dataset.mode === "signup" ? "Creating…" : "Signing in…");
  try {
    if (d.dataset.mode === "signup") {
      const ready = await store.signUp(email, password);
      if (!ready) {
        err.className = "notice warn";
        err.textContent = "Check your email for a confirmation link, then come back and sign in.";
        err.hidden = false;
        return;
      }
    } else {
      await store.signIn(email, password);
    }
    $("auth-password").value = "";
    d.close();
  } catch (ex) {
    err.className = "notice err";
    err.textContent = ex.message;
    err.hidden = false;
  } finally {
    setBusy(btn, null);
  }
}

// ---------- Wiring ----------

function wire() {
  // Food tabs
  document.querySelectorAll(".food [data-tab]").forEach((t) => t.addEventListener("click", () => {
    const kind = t.closest(".food").dataset.kind;
    food[kind].mode = t.dataset.tab;
    renderFood();
  }));
  $("jd").addEventListener("input", renderFood);
  $("resume").addEventListener("input", renderFood);
  $("feed-jd").addEventListener("click", feedJd);
  $("feed-resume").addEventListener("click", () => feedResume());
  $("jd-url").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); feedJd(); } });
  $("change-jd").addEventListener("click", () => unfeed("jd"));
  $("change-resume").addEventListener("click", () => unfeed("resume"));
  $("sample-food").addEventListener("click", feedSample);
  $("resume-file").addEventListener("change", (e) => readPdf(e.target.files[0]));

  // Drop zones: the PDF panel, and Nibbles itself (which eats the résumé straight away).
  const dropzone = $("dropzone");
  for (const [el, eatIt] of [[dropzone, false], [stage, true]]) {
    el.addEventListener("dragover", (e) => {
      if (stage.dataset.mode !== "feed") return;
      e.preventDefault();
      el.classList.add("dragover");
    });
    el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove("dragover"); });
    el.addEventListener("drop", async (e) => {
      if (stage.dataset.mode !== "feed") return;
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove("dragover");
      stage.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (await readPdf(file) && eatIt) {
        food.resume.fed = false;
        await feedResume($("monster"));
      }
    });
  }

  // API key and track
  $("key").addEventListener("input", updateKeyStatus);
  $("key").addEventListener("change", saveKeyPreference);
  $("remember").addEventListener("change", saveKeyPreference);
  $("toggle-key").addEventListener("click", () => {
    const hidden = $("key").type === "password";
    $("key").type = hidden ? "text" : "password";
    $("toggle-key").textContent = hidden ? "Hide" : "Show";
  });
  for (const t of TRACKS) $("track").add(new Option(t.label, t.key));

  // Interview
  $("start").addEventListener("click", () => startRun("interview"));
  $("start-drill").addEventListener("click", () => startRun("drill"));
  $("answer").addEventListener("input", syncAnswer);
  $("answer").addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submitAnswer(); }
  });
  $("submit").addEventListener("click", submitAnswer);
  $("skip").addEventListener("click", skipQuestion);
  $("use-sample-answer").addEventListener("click", () => {
    $("answer").value = app.session.qs[app.current].sampleAnswer;
    syncAnswer();
    $("answer").focus();
  });
  $("continue").addEventListener("click", continueInterview);
  $("new-food").addEventListener("click", feedNewFood);
  $("see-reviews").addEventListener("click", () => $("review").scrollIntoView({ behavior: "smooth", block: "start" }));

  // Timer and voice
  $("timer-limit").addEventListener("change", () => {
    try { localStorage.setItem(TIMER_STORAGE, $("timer-limit").value); } catch {}
    timer.setLimit(Number($("timer-limit").value));
  });
  if (speechSupported()) {
    $("mic").hidden = false;
    $("voice-note").hidden = false;
    $("mic").addEventListener("click", () => {
      dictation.toggle();
      $("answer").focus({ preventScroll: true });
    });
  }

  // Poking Nibbles
  let lastPoke = 0;
  $("monster").addEventListener("click", () => {
    if (Date.now() - lastPoke < 2500 || busy) return;
    lastPoke = Date.now();
    if (monster.form === "evil") {
      monster.say("Hands off! Focus on the question. 😤", { face: "smug", settle: "normal" });
    } else {
      monster.gulp();
      monster.say(pick(["Hehe, that tickles! 🤭", "Boop! Feed me something?", "I'm friendly. Mostly. 😇"]), { face: "happy" });
    }
  });

  // Nav
  $("to-bank").addEventListener("click", () => $("bank").scrollIntoView({ behavior: "smooth", block: "start" }));
  $("to-history").addEventListener("click", () => $("history").scrollIntoView({ behavior: "smooth", block: "start" }));

  // Accounts
  $("auth-btn").addEventListener("click", () => openAuth("signin"));
  $("auth-switch").addEventListener("click", () => openAuth($("auth-dialog").dataset.mode === "signup" ? "signin" : "signup"));
  $("auth-form").addEventListener("submit", submitAuth);
  $("auth-close").addEventListener("click", () => $("auth-dialog").close());
  $("account-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    $("account-menu").hidden = !$("account-menu").hidden;
  });
  document.addEventListener("click", (e) => { if (!$("account").contains(e.target)) $("account-menu").hidden = true; });
  $("sign-out").addEventListener("click", () => store.signOut());
  $("move-yes").addEventListener("click", async () => {
    setBusy($("move-yes"), "Moving…");
    try {
      await store.moveLocalToAccount();
      $("move-banner").hidden = true;
      await loadData();
    } catch (err) {
      showError(`Couldn't move your data: ${err.message}`);
    } finally {
      setBusy($("move-yes"), null);
    }
  });
  $("move-no").addEventListener("click", () => { moveDismissed = true; renderMoveBanner(); });

  initReview({ onRetry: grade, onChange: persist });
  initBank({ onError: showError, onChange: () => app.session && renderReview() });
  initHistory({ onOpen: openSession, onError: showError });
}

async function init() {
  wire();
  try {
    const saved = localStorage.getItem(KEY_STORAGE);
    if (saved) { $("key").value = saved; $("remember").checked = true; }
    const limit = localStorage.getItem(TIMER_STORAGE);
    if (limit && [...$("timer-limit").options].some((o) => o.value === limit)) $("timer-limit").value = limit;
  } catch {}
  updateKeyStatus();
  setMode("feed");
  renderFood();
  renderDrill();
  monster.say(LINES.intro, { face: "normal" });
  app.user = await store.initAuth(onAuthChange);
  renderAuth();
  await loadData();
}

init();
