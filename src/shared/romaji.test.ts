import { describe, expect, it } from "vite-plus/test";
import { canonicalRomaji, createMatcher } from "./romaji.ts";

describe("canonicalRomaji", () => {
  it("renders the spec beginner example", () => {
    expect(canonicalRomaji("かくにんします. しょうしょう おまちください.")).toBe(
      "kakuninshimasu. shoushou omachikudasai.",
    );
  });

  it("renders the spec intermediate example", () => {
    expect(
      canonicalRomaji("@tanaka みました. LGTMです. #128 は まーじ して だいじょうぶです."),
    ).toBe("@tanaka mimashita. LGTMdesu. #128 ha maaji shite daijoubudesu.");
  });

  it("doubles the sokuon consonant", () => {
    expect(canonicalRomaji("まって")).toBe("matte");
  });
});

describe("createMatcher", () => {
  it("accepts shi as the displayed form", () => {
    const matcher = createMatcher("し");
    expect(matcher.display).toBe("shi");
    expect(matcher.feed("s").accepted).toBe(true);
    expect(matcher.feed("h").accepted).toBe(true);
    expect(matcher.feed("i").completed).toBe(true);
  });

  it("accepts si as an alternate for し", () => {
    const matcher = createMatcher("し");
    expect(matcher.feed("s").accepted).toBe(true);
    const second = matcher.feed("i");
    expect(second.accepted).toBe(true);
    expect(second.completed).toBe(true);
  });

  it("counts a wrong key as a miss without advancing", () => {
    const matcher = createMatcher("か");
    expect(matcher.feed("x").accepted).toBe(false);
    expect(matcher.okLength()).toBe(0);
    expect(matcher.highlight()[0]?.state).toBe("bad");
    expect(matcher.feed("k").accepted).toBe(true);
    expect(matcher.feed("a").completed).toBe(true);
  });

  it("types mixed ascii literals exactly", () => {
    const matcher = createMatcher("LGTMです.");
    for (const ch of "LGTMdesu.") {
      expect(matcher.feed(ch).accepted).toBe(true);
    }
    expect(matcher.isComplete()).toBe(true);
  });

  it("accepts enter for a newline token", () => {
    const matcher = createMatcher("あ\nい");
    expect(matcher.feed("a").accepted).toBe(true);
    expect(matcher.feed("\n").accepted).toBe(true);
    expect(matcher.feed("i").completed).toBe(true);
  });
});
