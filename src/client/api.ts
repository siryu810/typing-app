import type { Difficulty, PlayPayload, Problem } from "../shared/types.ts";

export async function fetchProblems(difficulty: Difficulty): Promise<Problem[]> {
  const response = await fetch(`/api/problems?difficulty=${encodeURIComponent(difficulty)}`);
  if (!response.ok) {
    throw new Error("問題を取得できませんでした");
  }
  const data = (await response.json()) as { problems: Problem[] };
  return data.problems;
}

export async function savePlay(payload: PlayPayload): Promise<void> {
  const response = await fetch("/api/plays", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("結果を保存できませんでした");
  }
}
