export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const BASE_SALARY: Record<Difficulty, number> = {
  beginner: 300,
  intermediate: 450,
  advanced: 600,
};

export const BASE_REWARD: Record<Difficulty, number> = {
  beginner: 12,
  intermediate: 22,
  advanced: 38,
};

export const SESSION_SECONDS = 90;

export const GROWTH_TARGET = 8;

export type Problem = {
  id: number;
  difficulty: Difficulty;
  partnerName: string;
  partnerKey: string;
  incoming: string;
  replyJa: string;
  reading: string;
};

export type PlayPayload = {
  anonymousId: string;
  difficulty: Difficulty;
  salary: number;
  wpm: number;
  accuracy: number;
  misses: number;
  maxCombo: number;
  sentCount: number;
};

export type DifficultyMeta = {
  id: Difficulty;
  rank: string;
  title: string;
  salary: string;
  blurb: string;
  color: string;
};

export const DIFFICULTY_META: DifficultyMeta[] = [
  {
    id: "beginner",
    rank: "初級 · 基本給 300万",
    title: "新米エンジニア",
    salary: "300",
    blurb: "短い返信。簡単な日本語。まずは「確認します」から。",
    color: "var(--pink)",
  },
  {
    id: "intermediate",
    rank: "中級 · 基本給 450万",
    title: "一人前エンジニア",
    salary: "450",
    blurb: "@メンション、PR番号、軽いMarkdown。",
    color: "var(--violet)",
  },
  {
    id: "advanced",
    rank: "上級 · 基本給 600万",
    title: "つよつよエンジニア",
    salary: "600",
    blurb: "複数行と技術用語。障害対応も任せられる。",
    color: "var(--green)",
  },
];

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}
