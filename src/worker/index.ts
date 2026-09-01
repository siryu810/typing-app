import { Hono } from "hono";
import { isDifficulty, type Difficulty, type PlayPayload, type Problem } from "../shared/types.ts";

type Bindings = {
  DB: D1Database;
};

type ProblemRow = {
  id: number;
  difficulty: Difficulty;
  partner_name: string;
  partner_key: string;
  incoming: string;
  reply_ja: string;
  reading: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/api/problems", async (c) => {
  const difficulty = c.req.query("difficulty") ?? "";
  if (!isDifficulty(difficulty)) {
    return c.json({ error: "invalid difficulty" }, 400);
  }
  const result = await c.env.DB.prepare(
    `SELECT id, difficulty, partner_name, partner_key, incoming, reply_ja, reading
     FROM problems WHERE difficulty = ?`,
  )
    .bind(difficulty)
    .all<ProblemRow>();
  const problems: Problem[] = (result.results ?? []).map((row) => ({
    id: row.id,
    difficulty: row.difficulty,
    partnerName: row.partner_name,
    partnerKey: row.partner_key,
    incoming: row.incoming,
    replyJa: row.reply_ja,
    reading: row.reading,
  }));
  return c.json({ problems });
});

app.post("/api/plays", async (c) => {
  let body: PlayPayload;
  try {
    body = await c.req.json<PlayPayload>();
  } catch {
    return c.json({ error: "invalid json" }, 400);
  }
  if (!body.anonymousId || !isDifficulty(body.difficulty)) {
    return c.json({ error: "invalid payload" }, 400);
  }
  const salary = Number(body.salary);
  const wpm = Number(body.wpm);
  const accuracy = Number(body.accuracy);
  const misses = Number(body.misses);
  const maxCombo = Number(body.maxCombo);
  const sentCount = Number(body.sentCount);
  if (![salary, wpm, accuracy, misses, maxCombo, sentCount].every((n) => Number.isFinite(n))) {
    return c.json({ error: "invalid payload" }, 400);
  }
  await c.env.DB.prepare(
    `INSERT INTO plays (anonymous_id, difficulty, salary, wpm, accuracy, misses, max_combo, sent_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(body.anonymousId, body.difficulty, salary, wpm, accuracy, misses, maxCombo, sentCount)
    .run();
  return c.json({ ok: true }, 201);
});

export default app;
