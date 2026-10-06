// Nibbles: an original monster mascot drawn as inline SVG.
// Two forms (cute, evil) share one silhouette; faces are built from swappable parts.
import { sleep, reducedMotion } from "./util.js";

const SVG = `
<svg class="monster-svg" viewBox="0 0 260 260" role="img" aria-label="Nibbles the monster">
  <defs>
    <radialGradient id="nb-body-cute" cx="38%" cy="28%" r="78%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.45" stop-color="#eef2ff"/>
      <stop offset="0.8" stop-color="#cbd6fb"/>
      <stop offset="1" stop-color="#a7b7ef"/>
    </radialGradient>
    <radialGradient id="nb-body-evil" cx="38%" cy="28%" r="78%">
      <stop offset="0" stop-color="#ff9db7"/>
      <stop offset="0.4" stop-color="#e2346b"/>
      <stop offset="0.8" stop-color="#8f0f40"/>
      <stop offset="1" stop-color="#4c0623"/>
    </radialGradient>
    <radialGradient id="nb-aura" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#ff2d6f" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ff2d6f" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="nb-eye-evil" cx="45%" cy="40%" r="70%">
      <stop offset="0" stop-color="#fffbd0"/>
      <stop offset="0.45" stop-color="#ffd23a"/>
      <stop offset="1" stop-color="#ff4b1f"/>
    </radialGradient>
    <linearGradient id="nb-horn" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#d81b60"/>
      <stop offset="0.6" stop-color="#7a0c35"/>
      <stop offset="1" stop-color="#2b0515"/>
    </linearGradient>
    <linearGradient id="nb-horn-gold" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ffe7a0"/>
      <stop offset="0.55" stop-color="#e0a92a"/>
      <stop offset="1" stop-color="#8a5d00"/>
    </linearGradient>
    <filter id="nb-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <g id="nb-shape">
      <path d="M130 52 C186 52 214 98 214 150 C214 200 180 228 130 228 C80 228 46 200 46 150 C46 98 74 52 130 52 Z"/>
      <ellipse cx="50" cy="162" rx="14" ry="22" transform="rotate(28 50 162)"/>
      <ellipse cx="210" cy="162" rx="14" ry="22" transform="rotate(-28 210 162)"/>
      <ellipse cx="103" cy="226" rx="24" ry="12"/>
      <ellipse cx="157" cy="226" rx="24" ry="12"/>
    </g>
  </defs>

  <ellipse class="m-shadow" cx="130" cy="244" rx="72" ry="9"/>
  <ellipse class="evil-only m-aura" cx="130" cy="148" rx="122" ry="112" fill="url(#nb-aura)"/>

  <g class="m-bob">
    <g class="acc" data-max-tier="4">
      <g class="evil-only m-horns" stroke="#ff9cbb" stroke-width="2" stroke-linejoin="round">
        <path d="M102 72 C86 52 72 32 62 8 C88 22 106 42 118 66 Z" fill="url(#nb-horn)"/>
        <path d="M158 72 C174 52 188 32 198 8 C172 22 154 42 142 66 Z" fill="url(#nb-horn)"/>
      </g>
      <g class="cute-only">
        <ellipse cx="101" cy="62" rx="10" ry="14" transform="rotate(-22 101 62)" fill="url(#nb-body-cute)"/>
        <ellipse cx="159" cy="62" rx="10" ry="14" transform="rotate(22 159 62)" fill="url(#nb-body-cute)"/>
      </g>
    </g>
    <g class="acc" data-min-tier="5">
      <g class="evil-only m-horns" stroke="#fff3c4" stroke-width="2" stroke-linejoin="round">
        <path d="M102 72 C86 52 72 32 62 8 C88 22 106 42 118 66 Z" fill="url(#nb-horn-gold)"/>
        <path d="M158 72 C174 52 188 32 198 8 C172 22 154 42 142 66 Z" fill="url(#nb-horn-gold)"/>
      </g>
      <g class="cute-only">
        <ellipse cx="101" cy="62" rx="10" ry="14" transform="rotate(-22 101 62)" fill="url(#nb-horn-gold)"/>
        <ellipse cx="159" cy="62" rx="10" ry="14" transform="rotate(22 159 62)" fill="url(#nb-horn-gold)"/>
      </g>
    </g>

    <use href="#nb-shape" fill="url(#nb-body-cute)"/>
    <use class="evil-only" href="#nb-shape" fill="url(#nb-body-evil)"/>

    <ellipse cx="130" cy="176" rx="48" ry="36" fill="#fff" opacity="0.28"/>
    <ellipse cx="94" cy="92" rx="18" ry="9" transform="rotate(-32 94 92)" fill="#fff" opacity="0.75"/>

    <g class="m-face">
      <g class="part" data-part="cheeks">
        <ellipse cx="86" cy="162" rx="13" ry="8" fill="#ffb1c6" opacity="0.85"/>
        <ellipse cx="174" cy="162" rx="13" ry="8" fill="#ffb1c6" opacity="0.85"/>
      </g>

      <g class="part m-blink" data-part="eyes-round">
        <ellipse cx="104" cy="138" rx="12" ry="15" fill="#1d1f2e"/>
        <ellipse cx="156" cy="138" rx="12" ry="15" fill="#1d1f2e"/>
        <circle cx="108.5" cy="132" r="4.6" fill="#fff"/><circle cx="160.5" cy="132" r="4.6" fill="#fff"/>
        <circle cx="101" cy="144" r="2" fill="#fff"/><circle cx="153" cy="144" r="2" fill="#fff"/>
      </g>
      <g class="part" data-part="eyes-happy" fill="none" stroke="#1d1f2e" stroke-width="5.5" stroke-linecap="round">
        <path d="M92 141 q12 -15 24 0"/><path d="M144 141 q12 -15 24 0"/>
      </g>
      <g class="part" data-part="eyes-evil" filter="url(#nb-glow)">
        <path d="M88 130 L122 142 Q108 156 93 147 Z" fill="url(#nb-eye-evil)"/>
        <path d="M172 130 L138 142 Q152 156 167 147 Z" fill="url(#nb-eye-evil)"/>
        <ellipse cx="107" cy="144" rx="2.4" ry="5.5" fill="#1c0410"/><ellipse cx="153" cy="144" rx="2.4" ry="5.5" fill="#1c0410"/>
      </g>
      <g class="part" data-part="eyes-half" filter="url(#nb-glow)">
        <path d="M89 140 L122 143 Q107 152 92 147 Z" fill="url(#nb-eye-evil)"/>
        <path d="M171 140 L138 143 Q153 152 168 147 Z" fill="url(#nb-eye-evil)"/>
      </g>
      <g class="part" data-part="brows" stroke="#1c0410" stroke-width="7" stroke-linecap="round">
        <path d="M82 118 L122 132"/><path d="M178 118 L138 132"/>
      </g>

      <g class="part" data-part="mouth-smile">
        <path d="M115 169 q15 13 30 0" fill="none" stroke="#1d1f2e" stroke-width="5" stroke-linecap="round"/>
        <path d="M134 174 l4 7.5 l4 -6.5 z" fill="#fff" stroke="#1d1f2e" stroke-width="1.6" stroke-linejoin="round"/>
      </g>
      <g class="part" data-part="mouth-chew"><ellipse class="m-chew" cx="130" cy="173" rx="11" ry="8" fill="#3a1424"/></g>
      <g class="part" data-part="mouth-o"><ellipse cx="130" cy="176" rx="9" ry="11" fill="#3a1424"/></g>
      <g class="part" data-part="mouth-grin">
        <g class="m-talk">
          <path d="M94 164 Q130 204 166 164 Q130 182 94 164 Z" fill="#2a0612"/>
          <path d="M99 166 L105 176 L111 169 L118 180 L124 171 L130 182 L136 171 L142 180 L149 169 L155 176 L161 166 Q130 179 99 166 Z" fill="#fff"/>
        </g>
      </g>
      <g class="part" data-part="mouth-smirk">
        <path d="M110 171 Q136 184 154 161" fill="none" stroke="#2a0612" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M144 170 l3 8.5 l4.5 -7.5 z" fill="#fff" stroke="#2a0612" stroke-width="1.4" stroke-linejoin="round"/>
      </g>
    </g>

    <!-- Rank outfits: Associate tie, VP glasses, Partner blazer, Managing Partner monocle. -->
    <g class="acc" data-min-tier="4">
      <path d="M68 166 Q86 186 106 194 L99 227 Q76 221 60 199 Z" fill="#26324d"/>
      <path d="M192 166 Q174 186 154 194 L161 227 Q184 221 200 199 Z" fill="#26324d"/>
      <path d="M167 203 l12 -8 l3 11 z" fill="#ffffff"/>
    </g>
    <g class="acc" data-min-tier="2">
      <path d="M123 196 L137 196 L134 204 L126 204 Z" fill="#0b3b8c"/>
      <path d="M126 204 L134 204 L138 220 L130 227 L122 220 Z" fill="#1f5fd1"/>
      <path d="M124.5 211 L136.5 208 M123.5 218 L137.5 215" stroke="#9cc0ff" stroke-width="1.6"/>
    </g>
    <g class="acc" data-min-tier="3" data-max-tier="4" fill="none" stroke="#1d1f2e" stroke-width="3.5">
      <circle cx="104" cy="139" r="19" fill="rgba(255,255,255,0.14)"/>
      <circle cx="156" cy="139" r="19" fill="rgba(255,255,255,0.14)"/>
      <path d="M123 136 q7 -6 14 0"/>
    </g>
    <g class="acc" data-min-tier="5">
      <circle cx="156" cy="139" r="19" fill="rgba(255,255,255,0.18)" stroke="#d9a520" stroke-width="4"/>
      <path d="M172 150 Q184 178 171 202" fill="none" stroke="#d9a520" stroke-width="2"/>
    </g>
  </g>
</svg>`;

const FACES = {
  cute: {
    normal: ["cheeks", "eyes-round", "mouth-smile"],
    happy: ["cheeks", "eyes-happy", "mouth-smile"],
    chew: ["cheeks", "eyes-happy", "mouth-chew"],
    shocked: ["cheeks", "eyes-round", "mouth-o"]
  },
  evil: {
    normal: ["eyes-evil", "brows", "mouth-grin"],
    talk: ["eyes-evil", "brows", "mouth-grin", "talking"],
    smug: ["eyes-half", "brows", "mouth-smirk"],
    shocked: ["eyes-round", "mouth-o"]
  }
};

export function createMonster(host, bubble) {
  host.innerHTML = SVG;
  const svg = host.querySelector("svg");
  const parts = [...svg.querySelectorAll(".part")];
  const accessories = [...svg.querySelectorAll(".acc")];
  const textEl = bubble.querySelector("[data-bubble-text]");
  const subEl = bubble.querySelector("[data-bubble-sub]");
  let form = "cute";
  let face = "normal";
  let sayToken = 0;

  function apply() {
    const on = FACES[form][face] || FACES[form].normal;
    host.dataset.form = form;
    host.classList.toggle("talking", on.includes("talking"));
    parts.forEach((p) => p.classList.toggle("on", on.includes(p.dataset.part)));
  }

  function setFace(next) {
    face = next;
    apply();
  }

  function setForm(next) {
    form = next;
    if (!FACES[form][face]) face = "normal";
    apply();
  }

  // Animated switch between forms: a shake, then the swap mid-way.
  async function transform(next) {
    host.classList.add("transforming");
    document.body.classList.add("flash");
    await sleep(reducedMotion() ? 0 : 380);
    document.body.classList.toggle("evil", next === "evil");
    setForm(next);
    setFace("normal");
    await sleep(reducedMotion() ? 0 : 420);
    host.classList.remove("transforming");
    document.body.classList.remove("flash");
  }

  function gulp() {
    host.classList.remove("gulp");
    void host.offsetWidth;
    host.classList.add("gulp");
    host.addEventListener("animationend", () => host.classList.remove("gulp"), { once: true });
  }

  // Speech bubble with a quick typewriter effect. A newer say() cancels an older one.
  async function say(text, { sub = "", face: speakFace, settle } = {}) {
    const token = ++sayToken;
    subEl.textContent = sub;
    subEl.hidden = !sub;
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    if (speakFace) setFace(speakFace);
    if (reducedMotion() || text.length > 260) {
      textEl.textContent = text;
    } else {
      textEl.textContent = "";
      for (let i = 0; i < text.length; i += 2) {
        if (token !== sayToken) return;
        textEl.textContent = text.slice(0, i + 2);
        await sleep(14);
      }
    }
    if (token === sayToken && settle) setFace(settle);
  }

  // Rank 1–5 (Analyst → Managing Partner): outfit layers and bigger horns.
  function setTier(tier) {
    host.dataset.tier = tier;
    host.style.setProperty("--horn-scale", [0.85, 1, 1.1, 1.2, 1.28][tier - 1] ?? 1);
    accessories.forEach((el) => el.classList.toggle("acc-on",
      tier >= Number(el.dataset.minTier || 1) && tier <= Number(el.dataset.maxTier || 5)));
  }

  function celebrate() {
    host.classList.remove("celebrate");
    void host.offsetWidth;
    host.classList.add("celebrate");
    host.addEventListener("animationend", () => host.classList.remove("celebrate"), { once: true });
  }

  apply();
  setTier(1);
  return { setFace, setForm, setTier, transform, gulp, celebrate, say, get form() { return form; } };
}
