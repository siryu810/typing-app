import type { Difficulty } from "./types.ts";
import { BASE_REWARD } from "./types.ts";

export function replyWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) {
    return 0;
  }
  const minutes = elapsedMs / 60_000;
  return correctChars / 5 / minutes;
}

export function accuracyPercent(correct: number, misses: number): number {
  const total = correct + misses;
  if (total === 0) {
    return 100;
  }
  return (correct / total) * 100;
}

export function speedMultiplier(wpm: number): number {
  if (wpm < 20) {
    return 0.7;
  }
  if (wpm < 40) {
    return 0.85;
  }
  if (wpm < 60) {
    return 1;
  }
  if (wpm < 80) {
    return 1.1;
  }
  return 1.2;
}

export function accuracyMultiplier(percent: number): number {
  if (percent >= 100) {
    return 1.15;
  }
  if (percent >= 95) {
    return 1.05;
  }
  if (percent >= 90) {
    return 1;
  }
  if (percent >= 80) {
    return 0.85;
  }
  return 0.7;
}

export function replyReward(
  difficulty: Difficulty,
  correctChars: number,
  misses: number,
  elapsedMs: number,
): number {
  const wpm = replyWpm(correctChars, elapsedMs);
  const acc = accuracyPercent(correctChars, misses);
  const raw = BASE_REWARD[difficulty] * speedMultiplier(wpm) * accuracyMultiplier(acc);
  return Math.max(1, Math.round(raw));
}

export function roundStat(value: number): number {
  return Math.round(value);
}
