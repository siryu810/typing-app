import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getAnonymousId } from "./anonymousId.ts";
import { fetchProblems, savePlay } from "./api.ts";
import { createMatcher, type HighlightChar, type RomajiMatcher } from "../shared/romaji.ts";
import { accuracyPercent, replyReward, replyWpm, roundStat } from "../shared/score.ts";
import {
  BASE_SALARY,
  DIFFICULTY_META,
  GROWTH_TARGET,
  SESSION_SECONDS,
  type Difficulty,
  type Problem,
} from "../shared/types.ts";

type Screen = "home" | "difficulty" | "typing" | "result";

type ChatMsg = {
  id: string;
  role: "them" | "me";
  name?: string;
  partnerKey?: string;
  text: string;
  time: string;
  current?: boolean;
};

type Toast = { sent: boolean; yen: number } | null;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = current;
  }
  return copy;
}

function formatRemain(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clockLabel(startedAt: number): string {
  const elapsedMin = Math.floor((Date.now() - startedAt) / 60_000);
  const hours = 9;
  const mins = 41 + elapsedMin;
  const h = hours + Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function avatarClass(key: string | undefined): string {
  if (key === "suzuki" || key === "tanaka" || key === "sato") {
    return key;
  }
  return "sato";
}

function avatarGlyph(name: string | undefined): string {
  return name?.slice(0, 1) ?? "?";
}

function titleFor(difficulty: Difficulty): string {
  return DIFFICULTY_META.find((item) => item.id === difficulty)?.title ?? "";
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [salary, setSalary] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [remaining, setRemaining] = useState(SESSION_SECONDS);
  const [chars, setChars] = useState<HighlightChar[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wpmLive, setWpmLive] = useState(0);
  const [accLive, setAccLive] = useState(100);

  const matcherRef = useRef<RomajiMatcher | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const threadRef = useRef<HTMLDivElement | null>(null);
  const startedAtRef = useRef(0);
  const replyStartedAtRef = useRef(0);
  const replyCorrectRef = useRef(0);
  const replyMissRef = useRef(0);
  const finishedRef = useRef(false);
  const remainingRef = useRef(SESSION_SECONDS);
  const statsRef = useRef({
    salary: 0,
    misses: 0,
    correctKeys: 0,
    maxCombo: 0,
    sentCount: 0,
    difficulty: "beginner" as Difficulty,
  });
  const toastTimerRef = useRef<number>(0);
  const problemCursorRef = useRef(0);
  const problemsRef = useRef<Problem[]>([]);

  const currentProblem = problems[problemIndex] ?? null;

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const refreshLive = useCallback(() => {
    const elapsed = Date.now() - startedAtRef.current;
    const { correctKeys: correct, misses: miss } = statsRef.current;
    setWpmLive(roundStat(replyWpm(correct, elapsed)));
    setAccLive(roundStat(accuracyPercent(correct, miss)));
  }, []);

  const presentProblem = useCallback((problem: Problem, startedAt: number) => {
    const matcher = createMatcher(problem.reading);
    matcherRef.current = matcher;
    setChars(matcher.highlight());
    replyStartedAtRef.current = Date.now();
    replyCorrectRef.current = 0;
    replyMissRef.current = 0;
    setMessages((prev) => [
      ...prev.map((msg) => ({ ...msg, current: false })),
      {
        id: `them-${problem.id}-${Date.now()}`,
        role: "them",
        name: problem.partnerName,
        partnerKey: problem.partnerKey,
        text: problem.incoming,
        time: clockLabel(startedAt),
        current: true,
      },
    ]);
  }, []);

  const finishSession = useCallback(async () => {
    if (finishedRef.current) {
      return;
    }
    finishedRef.current = true;
    const elapsed = Math.max(1, Date.now() - startedAtRef.current);
    const stats = statsRef.current;
    const wpm = roundStat(replyWpm(stats.correctKeys, elapsed));
    const accuracy = roundStat(accuracyPercent(stats.correctKeys, stats.misses));
    setWpmLive(wpm);
    setAccLive(accuracy);
    setRemaining(0);
    setScreen("result");
    try {
      await savePlay({
        anonymousId: getAnonymousId(),
        difficulty: stats.difficulty,
        salary: stats.salary,
        wpm,
        accuracy,
        misses: stats.misses,
        maxCombo: stats.maxCombo,
        sentCount: stats.sentCount,
      });
    } catch {
      // 結果表示は続ける。保存失敗は黙って許容する。
    }
  }, []);

  const sendReply = useCallback(
    (problem: Problem) => {
      const elapsed = Date.now() - replyStartedAtRef.current;
      const reward = replyReward(
        problem.difficulty,
        replyCorrectRef.current,
        replyMissRef.current,
        elapsed,
      );
      const nextSalary = statsRef.current.salary + reward;
      const nextSent = statsRef.current.sentCount + 1;
      statsRef.current.salary = nextSalary;
      statsRef.current.sentCount = nextSent;
      setSalary(nextSalary);
      setSentCount(nextSent);
      setToast({ sent: true, yen: reward });
      window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => setToast(null), 1800);
      setMessages((prev) => [
        ...prev.map((msg) => ({ ...msg, current: false })),
        {
          id: `me-${problem.id}-${Date.now()}`,
          role: "me",
          text: problem.replyJa,
          time: clockLabel(startedAtRef.current),
        },
      ]);
      const list = problemsRef.current;
      const nextIndex = (problemCursorRef.current + 1) % Math.max(list.length, 1);
      problemCursorRef.current = nextIndex;
      setProblemIndex(nextIndex);
      const next = list[nextIndex];
      if (next) {
        presentProblem(next, startedAtRef.current);
      }
    },
    [presentProblem],
  );

  const handleKey = useCallback(
    (key: string) => {
      if (screen !== "typing" || finishedRef.current || remainingRef.current <= 0) {
        return;
      }
      const matcher = matcherRef.current;
      const problem = problemsRef.current[problemCursorRef.current];
      if (!matcher || !problem) {
        return;
      }
      const result = matcher.feed(key);
      setChars(matcher.highlight());
      if (!result.accepted) {
        statsRef.current.misses += 1;
        replyMissRef.current += 1;
        setMisses(statsRef.current.misses);
        setCombo(0);
        refreshLive();
        return;
      }
      statsRef.current.correctKeys += 1;
      replyCorrectRef.current += 1;
      setCombo((prev) => {
        const next = prev + 1;
        if (next > statsRef.current.maxCombo) {
          statsRef.current.maxCombo = next;
          setMaxCombo(next);
        }
        return next;
      });
      refreshLive();
      if (result.completed) {
        sendReply(problem);
      }
    },
    [refreshLive, screen, sendReply],
  );

  const startDifficulty = useCallback(
    async (next: Difficulty) => {
      setError(null);
      setLoading(true);
      setDifficulty(next);
      finishedRef.current = false;
      try {
        const loaded = shuffle(await fetchProblems(next));
        if (loaded.length === 0) {
          throw new Error("問題がありません");
        }
        problemsRef.current = loaded;
        problemCursorRef.current = 0;
        setProblems(loaded);
        setProblemIndex(0);
        setMessages([]);
        const base = BASE_SALARY[next];
        statsRef.current = {
          salary: base,
          misses: 0,
          correctKeys: 0,
          maxCombo: 0,
          sentCount: 0,
          difficulty: next,
        };
        setSalary(base);
        setCombo(0);
        setMaxCombo(0);
        setMisses(0);
        setSentCount(0);
        setToast(null);
        remainingRef.current = SESSION_SECONDS;
        setRemaining(SESSION_SECONDS);
        startedAtRef.current = Date.now();
        setWpmLive(0);
        setAccLive(100);
        setScreen("typing");
        presentProblem(loaded[0]!, startedAtRef.current);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "開始できませんでした");
        setScreen("difficulty");
      } finally {
        setLoading(false);
      }
    },
    [presentProblem],
  );

  useEffect(() => {
    if (screen !== "typing" || finishedRef.current) {
      return;
    }
    const id = window.setInterval(() => {
      remainingRef.current = Math.max(0, remainingRef.current - 0.1);
      setRemaining(remainingRef.current);
      refreshLive();
      if (remainingRef.current <= 0) {
        void finishSession();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [finishSession, refreshLive, screen]);

  useEffect(() => {
    if (screen === "typing") {
      focusInput();
    }
  }, [focusInput, screen, problemIndex]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.key === "Process") {
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      handleKey("\n");
      return;
    }
    if (event.key.length === 1) {
      event.preventDefault();
      handleKey(event.key);
    }
  };

  if (screen === "home") {
    return (
      <section className="screen home">
        <div className="pad">
          <div className="kicker">株式会社カイト · 開発チーム配属</div>
          <h1>
            Reply Day
            <br />
            <em>今日も返信します</em>
          </h1>
          <p className="sub">
            社内チャットに届いた依頼を、正確に、早く返す。返すたびに年収が上がり、新米からつよつよへ近づきます。
          </p>
          <button className="btn btn-violet" type="button" onClick={() => setScreen("difficulty")}>
            業務を開始する
          </button>
          <div className="soon">タイピング分析 · 準備中</div>
        </div>
      </section>
    );
  }

  if (screen === "difficulty") {
    return (
      <section className="screen difficulty">
        <div className="pad">
          <div className="kicker">今日の役割</div>
          <h1>どの自分で働く？</h1>
          <p className="sub">
            制限時間はいずれも90秒。返信が難しいほど、加算される年収も大きくなります。
          </p>
          <div className="diff-grid">
            {DIFFICULTY_META.map((item) => (
              <button
                key={item.id}
                className="diff-card"
                type="button"
                disabled={loading}
                onClick={() => void startDifficulty(item.id)}
              >
                <div className="dot" style={{ background: item.color }} />
                <small>{item.rank}</small>
                <h3>{item.title}</h3>
                <p>{item.blurb}</p>
              </button>
            ))}
          </div>
          {error ? <p className="error-msg">{error}</p> : null}
          {loading ? <p className="status-msg">配属手続き中…</p> : null}
        </div>
      </section>
    );
  }

  if (screen === "result" && difficulty) {
    const base = BASE_SALARY[difficulty];
    const delta = salary - base;
    return (
      <section className="screen result">
        <div className="pad">
          <div className="kicker">退勤レポート</div>
          <div style={{ color: "var(--muted)", fontWeight: 700 }}>本日の年収</div>
          <div className="salary">{salary}万円</div>
          <div className="result-delta">
            基本給から {delta >= 0 ? "+" : ""}
            {delta}万円
          </div>
          <div className="stats">
            <div className="stat">
              <small>入力速度</small>
              <b>{wpmLive} WPM</b>
            </div>
            <div className="stat">
              <small>正確率</small>
              <b>{accLive}%</b>
            </div>
            <div className="stat">
              <small>ミス数</small>
              <b>{misses}</b>
            </div>
            <div className="stat">
              <small>最大連続入力</small>
              <b>{maxCombo}</b>
            </div>
          </div>
          <div className="actions">
            <button
              className="btn btn-violet"
              type="button"
              onClick={() => setScreen("difficulty")}
            >
              もう一度
            </button>
            <button className="btn btn-line" type="button" onClick={() => setScreen("home")}>
              ホーム
            </button>
          </div>
          <div className="soon">タイピング分析 · 準備中</div>
        </div>
      </section>
    );
  }

  const growth = Math.min(100, (sentCount / GROWTH_TARGET) * 100);
  const growthTitle = difficulty ? titleFor(difficulty) : "";

  return (
    <section className="screen typing">
      <aside className="rail">
        <div className="brand">
          <div className="logo">K</div>
          <div>
            <small>株式会社カイト</small>
            <strong>カイトチャット</strong>
          </div>
        </div>
        <div className="pay-block">
          <div className="pay-label">現在年収</div>
          <div className="pay">{salary}万</div>
          {toast ? <div className="pay-delta">+{toast.yen}万</div> : null}
        </div>
        <div className="combo-box">
          <span>COMBO</span>
          <strong>{combo}</strong>
        </div>
        <div>
          <div className="grow-label">今日の成長</div>
          <div className="bar">
            <i style={{ width: `${growth}%` }} />
          </div>
          <div className="grow-meta">
            {growthTitle} {Math.round(growth)}%
          </div>
        </div>
        <div className="mini">
          <div>
            WPM<b>{wpmLive}</b>
          </div>
          <div>
            正確率<b>{accLive}%</b>
          </div>
          <div>
            ミス<b>{misses}</b>
          </div>
          <div>
            残り<b>{formatRemain(remaining)}</b>
          </div>
        </div>
      </aside>
      <div className="main">
        <div className="main-head">
          <div className="room">
            開発ルーム <span>カイト プロダクト開発</span>
          </div>
          <div className="sent-count">送信済み {sentCount}件</div>
        </div>
        <div className="thread" ref={threadRef}>
          {messages.map((msg) =>
            msg.role === "them" ? (
              <div key={msg.id} className={msg.current ? "msg current" : "msg"}>
                <div className={`av ${avatarClass(msg.partnerKey)}`}>{avatarGlyph(msg.name)}</div>
                <div className="bubble">
                  <div className="meta">
                    {msg.name} · {msg.time}
                    {msg.current ? <span className="badge-new">返信する</span> : null}
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="msg me">
                <div className="av me">己</div>
                <div className="bubble">
                  <div className="meta">
                    あなた · {msg.time} <span className="badge-sent">送信済み</span>
                  </div>
                  <p>{msg.text}</p>
                </div>
              </div>
            ),
          )}
        </div>
        <div className="compose-wrap">
          <input
            ref={inputRef}
            className="hidden-input"
            value=""
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            lang="en"
            aria-label="ローマ字入力"
            onChange={() => undefined}
            onKeyDown={onKeyDown}
            onBlur={focusInput}
          />
          <div className="feedback">
            {toast ? (
              <>
                <span className="toast ok">送信しました</span>
                <span className="toast yen">+{toast.yen}万</span>
              </>
            ) : null}
          </div>
          <div className="compose" onClick={focusInput}>
            <div className="compose-label">これから送る返信</div>
            <div className="jp">{currentProblem?.replyJa ?? ""}</div>
            <div className="roma">
              {chars.map((item, index) => (
                <span key={`${index}-${item.ch}`} className={`ch-${item.state}`}>
                  {item.ch}
                </span>
              ))}
            </div>
            <div className="compose-foot">
              <span>打ち切ると自動送信 · ミス {misses}</span>
              <button className="send" type="button" disabled>
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
