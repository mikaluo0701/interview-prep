// Game rules: XP, levels, Nibbles' boss rank, and skill tracking. Pure functions, no DOM.

export const SKILLS = [
  { key: "structure", label: "Structure" },
  { key: "specificity", label: "Specificity" },
  { key: "impact", label: "Quantified impact" },
  { key: "relevance", label: "Relevance" },
  { key: "concision", label: "Concision" }
];

const THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
const TITLES = ["Pre-MBA", "Coffee Chatter", "Networker", "Closed List", "First Round", "Second Round", "Superday", "Final Round", "Offer Pending", "Offer in Hand"];
const XP_PER_LEVEL_AFTER_10 = 800;

// Nibbles gets promoted as the student levels up; senior interviewers ask sharper questions.
export const TIERS = [
  { tier: 1, name: "Analyst", minLevel: 1 },
  { tier: 2, name: "Associate", minLevel: 3 },
  { tier: 3, name: "VP", minLevel: 5 },
  { tier: 4, name: "Partner", minLevel: 7 },
  { tier: 5, name: "Managing Partner", minLevel: 9 }
];

export const COMPLETION_XP = { interview: 40, drill: 30 };
export const ON_TIME_XP = 5;
export const DRILL_UNLOCK_ANSWERS = 5;
const SKILL_SMOOTHING = 0.25;

export function levelStart(level) {
  return level <= THRESHOLDS.length ? THRESHOLDS[level - 1] : THRESHOLDS.at(-1) + (level - THRESHOLDS.length) * XP_PER_LEVEL_AFTER_10;
}

export function levelFor(xp) {
  let level = 1;
  while (xp >= levelStart(level + 1)) level++;
  return level;
}

export const levelTitle = (level) => TITLES[level - 1] ?? "Recruiting Legend";
export const tierFor = (level) => TIERS.findLast((t) => level >= t.minLevel);
export const tierMultiplier = (tier) => 1 + 0.1 * (tier - 1);

export function levelInfo(xp) {
  const level = levelFor(xp);
  const start = levelStart(level);
  const next = levelStart(level + 1);
  return { xp, level, title: levelTitle(level), tier: tierFor(level), into: xp - start, span: next - start, toNext: next - xp };
}

// XP for one reviewed answer: 6–30 from the average rubric score, scaled by the interviewer's rank.
export function answerXp(avgScore, tier, onTime) {
  return Math.round(avgScore * 6 * tierMultiplier(tier)) + (onTime ? ON_TIME_XP : 0);
}

// Moving average per skill, so recent answers count more than old ones.
export function updateSkills(skills, scores) {
  const next = { ...skills };
  for (const { key } of SKILLS) {
    const v = Number(scores?.[key]);
    if (!(v >= 1 && v <= 5)) continue;
    next[key] = next[key] == null ? v : next[key] + SKILL_SMOOTHING * (v - next[key]);
  }
  return next;
}

export function weakestSkills(skills, n = 2) {
  return SKILLS.filter((s) => skills?.[s.key] != null)
    .sort((a, b) => skills[a.key] - skills[b.key])
    .slice(0, n)
    .map((s) => ({ ...s, value: skills[s.key] }));
}

export const emptyProgress = () => ({ xp: 0, answers: 0, skills: {} });

// Combine browser progress into account progress (used when a guest signs in).
export function mergeProgress(a, b) {
  const skills = { ...a.skills };
  for (const { key } of SKILLS) {
    const x = a.skills?.[key], y = b.skills?.[key];
    if (x == null) skills[key] = y;
    else if (y != null) skills[key] = (x * a.answers + y * b.answers) / Math.max(1, a.answers + b.answers);
  }
  for (const k of Object.keys(skills)) if (skills[k] == null) delete skills[k];
  return { xp: a.xp + b.xp, answers: a.answers + b.answers, skills };
}
