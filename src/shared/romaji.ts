export type CharState = "ok" | "bad" | "cur" | "pending";

export type HighlightChar = {
  ch: string;
  state: CharState;
};

type Token = {
  canonical: string;
  alts: string[];
};

type Mora = {
  canonical: string;
  alts: string[];
};

const MORA = new Map<string, Mora>();

function mora(kana: string, canonical: string, extra: string[] = []): void {
  MORA.set(kana, { canonical, alts: unique([canonical, ...extra]) });
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

mora("あ", "a");
mora("い", "i");
mora("う", "u");
mora("え", "e");
mora("お", "o");
mora("か", "ka");
mora("き", "ki");
mora("く", "ku");
mora("け", "ke");
mora("こ", "ko");
mora("さ", "sa");
mora("し", "shi", ["si"]);
mora("す", "su");
mora("せ", "se");
mora("そ", "so");
mora("た", "ta");
mora("ち", "chi", ["ti"]);
mora("つ", "tsu", ["tu"]);
mora("て", "te");
mora("と", "to");
mora("な", "na");
mora("に", "ni");
mora("ぬ", "nu");
mora("ね", "ne");
mora("の", "no");
mora("は", "ha");
mora("ひ", "hi");
mora("ふ", "fu", ["hu"]);
mora("へ", "he");
mora("ほ", "ho");
mora("ま", "ma");
mora("み", "mi");
mora("む", "mu");
mora("め", "me");
mora("も", "mo");
mora("や", "ya");
mora("ゆ", "yu");
mora("よ", "yo");
mora("ら", "ra");
mora("り", "ri");
mora("る", "ru");
mora("れ", "re");
mora("ろ", "ro");
mora("わ", "wa");
mora("を", "wo", ["o"]);
mora("が", "ga");
mora("ぎ", "gi");
mora("ぐ", "gu");
mora("げ", "ge");
mora("ご", "go");
mora("ざ", "za");
mora("じ", "ji", ["zi"]);
mora("ず", "zu", ["du"]);
mora("ぜ", "ze");
mora("ぞ", "zo");
mora("だ", "da");
mora("ぢ", "ji", ["di", "dzi"]);
mora("づ", "zu", ["du", "dzu"]);
mora("で", "de");
mora("ど", "do");
mora("ば", "ba");
mora("び", "bi");
mora("ぶ", "bu");
mora("べ", "be");
mora("ぼ", "bo");
mora("ぱ", "pa");
mora("ぴ", "pi");
mora("ぷ", "pu");
mora("ぺ", "pe");
mora("ぽ", "po");
mora("きゃ", "kya");
mora("きぃ", "kyi");
mora("きゅ", "kyu");
mora("きぇ", "kye");
mora("きょ", "kyo");
mora("しゃ", "sha", ["sya"]);
mora("しぃ", "syi", ["shi"]);
mora("しゅ", "shu", ["syu"]);
mora("しぇ", "she", ["sye"]);
mora("しょ", "sho", ["syo"]);
mora("ちゃ", "cha", ["tya", "cya"]);
mora("ちぃ", "tyi", ["cyi"]);
mora("ちゅ", "chu", ["tyu", "cyu"]);
mora("ちぇ", "che", ["tye", "cye"]);
mora("ちょ", "cho", ["tyo", "cyo"]);
mora("にゃ", "nya");
mora("にゅ", "nyu");
mora("にょ", "nyo");
mora("ひゃ", "hya");
mora("ひゅ", "hyu");
mora("ひょ", "hyo");
mora("みゃ", "mya");
mora("みゅ", "myu");
mora("みょ", "myo");
mora("りゃ", "rya");
mora("りゅ", "ryu");
mora("りょ", "ryo");
mora("ぎゃ", "gya");
mora("ぎゅ", "gyu");
mora("ぎょ", "gyo");
mora("じゃ", "ja", ["zya", "jya"]);
mora("じゅ", "ju", ["zyu", "jyu"]);
mora("じぇ", "je", ["zye"]);
mora("じょ", "jo", ["zyo", "jyo"]);
mora("びゃ", "bya");
mora("びゅ", "byu");
mora("びょ", "byo");
mora("ぴゃ", "pya");
mora("ぴゅ", "pyu");
mora("ぴょ", "pyo");
mora("ふぁ", "fa");
mora("ふぃ", "fi");
mora("ふぅ", "fu");
mora("ふぇ", "fe");
mora("ふぉ", "fo");
mora("ゔぁ", "va");
mora("ゔぃ", "vi");
mora("ゔ", "vu");
mora("ゔぅ", "vu");
mora("ゔぇ", "ve");
mora("ゔぉ", "vo");
mora("てぃ", "ti", ["thi"]);
mora("とぅ", "tu", ["twu"]);
mora("でぃ", "di", ["dhi"]);
mora("どぅ", "du", ["dwu"]);
mora("うぃ", "wi");
mora("うぇ", "we");
mora("うぉ", "who", ["uxo"]);
mora("くぁ", "qa", ["kwa"]);
mora("くぃ", "qi", ["kwi"]);
mora("くぇ", "qe", ["kwe"]);
mora("くぉ", "qo", ["kwo"]);

const VOWEL_HIRA = new Set(["あ", "い", "う", "え", "お"]);
const Y_HIRA = new Set(["や", "ゆ", "よ", "ゃ", "ゅ", "ょ"]);

function charsOf(value: string): string[] {
  return Array.from(value);
}

function toHiraganaChar(ch: string): string {
  const code = ch.codePointAt(0);
  if (code === undefined) {
    return ch;
  }
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCodePoint(code - 0x60);
  }
  return ch;
}

function lastVowel(romaji: string): string {
  for (let i = romaji.length - 1; i >= 0; i -= 1) {
    const ch = romaji[i]!.toLowerCase();
    if ("aiueo".includes(ch)) {
      return ch;
    }
  }
  return "";
}

function sokuonLetters(nextHira: string, nextCanonical: string): string[] {
  if (
    nextHira.startsWith("ち") ||
    nextHira.startsWith("ちゃ") ||
    nextHira.startsWith("ちゅ") ||
    nextHira.startsWith("ちょ")
  ) {
    return ["t", "c"];
  }
  const first = nextCanonical[0]?.toLowerCase() ?? "";
  if (first && /[bcdfghjklmnpqrstvwxyz]/.test(first)) {
    return [first];
  }
  return [];
}

function parseMora(
  source: string,
  index: number,
): { token: Token; hira: string; next: number } | null {
  const two = source.slice(index, index + 2);
  const one = source[index];
  if (two.length === 2) {
    const found = MORA.get(two);
    if (found) {
      return {
        token: { canonical: found.canonical, alts: found.alts },
        hira: two,
        next: index + 2,
      };
    }
  }
  if (one) {
    const found = MORA.get(one);
    if (found) {
      return {
        token: { canonical: found.canonical, alts: found.alts },
        hira: one,
        next: index + 1,
      };
    }
  }
  return null;
}

function nToken(next: string | undefined): Token {
  const beforeVowelOrN = !next || VOWEL_HIRA.has(next) || next === "ん";
  if (beforeVowelOrN) {
    return { canonical: "nn", alts: ["nn", "n'"] };
  }
  if (next && Y_HIRA.has(next)) {
    return { canonical: "n", alts: ["n", "nn", "n'"] };
  }
  return { canonical: "n", alts: ["n", "nn", "n'"] };
}

export function tokenizeReading(reading: string): Token[] {
  const source = charsOf(reading).map(toHiraganaChar).join("");
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i]!;
    if (ch === "っ") {
      const nextMora = parseMora(source, i + 1);
      if (!nextMora) {
        tokens.push({ canonical: "ltu", alts: ["ltu", "xtu", "ltsu", "xtsu"] });
        i += 1;
        continue;
      }
      const letters = sokuonLetters(nextMora.hira, nextMora.token.canonical);
      const primary = letters[0] ?? "t";
      tokens.push({
        canonical: primary,
        alts: unique([...letters, "ltu", "xtu", "ltsu", "xtsu"]),
      });
      tokens.push(nextMora.token);
      i = nextMora.next;
      continue;
    }
    if (ch === "ん") {
      tokens.push(nToken(source[i + 1]));
      i += 1;
      continue;
    }
    if (ch === "ー") {
      const vowel = lastVowel(tokens.at(-1)?.canonical ?? "") || "-";
      tokens.push({ canonical: vowel, alts: [vowel] });
      i += 1;
      continue;
    }
    const parsed = parseMora(source, i);
    if (parsed) {
      tokens.push(parsed.token);
      i = parsed.next;
      continue;
    }
    if (ch === "。") {
      tokens.push({ canonical: ".", alts: ["."] });
      i += 1;
      continue;
    }
    if (ch === "、") {
      tokens.push({ canonical: ",", alts: [","] });
      i += 1;
      continue;
    }
    if (ch === "！") {
      tokens.push({ canonical: "!", alts: ["!"] });
      i += 1;
      continue;
    }
    if (ch === "？") {
      tokens.push({ canonical: "?", alts: ["?"] });
      i += 1;
      continue;
    }
    if (ch === "　") {
      tokens.push({ canonical: " ", alts: [" "] });
      i += 1;
      continue;
    }
    tokens.push({ canonical: ch, alts: [ch] });
    i += 1;
  }
  return tokens;
}

export function canonicalRomaji(reading: string): string {
  return tokenizeReading(reading)
    .map((token) => token.canonical)
    .join("");
}

function sharedPrefixLen(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) {
    i += 1;
  }
  return i;
}

export type FeedResult = {
  accepted: boolean;
  completed: boolean;
  tokenCompleted: boolean;
};

export type RomajiMatcher = {
  display: string;
  feed: (char: string) => FeedResult;
  highlight: () => HighlightChar[];
  isComplete: () => boolean;
  okLength: () => number;
};

export function createMatcher(reading: string): RomajiMatcher {
  const tokens = tokenizeReading(reading);
  const display = tokens.map((token) => token.canonical).join("");
  let tokenIndex = 0;
  let typed = "";
  let missed = false;

  function current(): Token | undefined {
    return tokens[tokenIndex];
  }

  function matchingAlts(nextTyped: string): string[] {
    const token = current();
    if (!token) {
      return [];
    }
    return token.alts.filter((alt) => alt.startsWith(nextTyped));
  }

  function okLength(): number {
    let length = 0;
    for (let i = 0; i < tokenIndex; i += 1) {
      length += tokens[i]!.canonical.length;
    }
    const token = current();
    if (token && typed) {
      length += sharedPrefixLen(token.canonical, typed);
    }
    return length;
  }

  function isComplete(): boolean {
    return tokenIndex >= tokens.length;
  }

  function feed(char: string): FeedResult {
    if (isComplete()) {
      return { accepted: false, completed: true, tokenCompleted: false };
    }
    const nextTyped = typed + char;
    const matches = matchingAlts(nextTyped);
    if (matches.length === 0) {
      missed = true;
      return { accepted: false, completed: false, tokenCompleted: false };
    }
    missed = false;
    const exact = matches.find((alt) => alt === nextTyped);
    if (exact) {
      tokenIndex += 1;
      typed = "";
      return { accepted: true, completed: isComplete(), tokenCompleted: true };
    }
    typed = nextTyped;
    return { accepted: true, completed: false, tokenCompleted: false };
  }

  function highlight(): HighlightChar[] {
    const ok = okLength();
    const cur = isComplete() ? display.length : ok;
    return charsOf(display).map((ch, index) => {
      if (index < ok) {
        return { ch, state: "ok" as const };
      }
      if (index === cur) {
        return { ch, state: missed ? ("bad" as const) : ("cur" as const) };
      }
      return { ch, state: "pending" as const };
    });
  }

  return { display, feed, highlight, isComplete, okLength };
}
