// Spoken answers (browser speech-to-text) and the per-question answer timer.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const speechSupported = () => Boolean(Recognition);

// Dictates into a textarea. Final text is appended after whatever was already typed;
// interim words show live and are replaced as recognition firms them up.
export function createDictation(textarea, { onChange = () => {}, onError = () => {} } = {}) {
  let rec = null;
  let listening = false;
  let base = "";
  let finalText = "";

  const join = (...parts) => parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trimStart();

  function start() {
    if (!Recognition || listening) return;
    base = textarea.value.trim();
    finalText = "";
    rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText = join(finalText, r[0].transcript.trim());
        else interim += r[0].transcript;
      }
      textarea.value = join(base, finalText, interim.trim());
      textarea.dispatchEvent(new Event("input"));
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      listening = false;
      onChange(false);
      onError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone access is blocked. Allow it in your browser's site settings, or type your answer."
        : `Voice input stopped (${e.error}). You can keep typing or try again.`);
    };
    // Browsers end recognition after a pause; keep going until the user stops it.
    rec.onend = () => {
      if (!listening) return;
      base = join(base, finalText);
      finalText = "";
      try { rec.start(); } catch { listening = false; onChange(false); }
    };
    listening = true;
    rec.start();
    onChange(true);
  }

  function stop() {
    if (!listening) return;
    listening = false;
    rec?.stop();
    onChange(false);
  }

  return { start, stop, toggle: () => (listening ? stop() : start()), get listening() { return listening; } };
}

// Counts up from when a question appears. limit is in seconds; 0 means no limit.
export function createTimer(onTick) {
  let startedAt = 0;
  let interval = null;
  let limit = 0;
  const elapsed = () => (startedAt ? (performance.now() - startedAt) / 1000 : 0);

  return {
    start(limitSeconds) {
      limit = limitSeconds;
      startedAt = performance.now();
      clearInterval(interval);
      interval = setInterval(() => onTick(elapsed(), limit), 250);
      onTick(0, limit);
    },
    stop() {
      clearInterval(interval);
      interval = null;
      const s = elapsed();
      startedAt = 0;
      return s;
    },
    elapsed,
    setLimit(l) {
      limit = l;
      if (startedAt) onTick(elapsed(), limit);
    },
    get limit() { return limit; }
  };
}
