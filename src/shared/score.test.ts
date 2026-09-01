import { describe, expect, it } from "vite-plus/test";
import { accuracyMultiplier, accuracyPercent, replyReward, speedMultiplier } from "./score.ts";

describe("score", () => {
  it("boosts a fast perfect reply above the base", () => {
    const reward = replyReward("beginner", 50, 0, 8_000);
    expect(reward).toBeGreaterThan(12);
  });

  it("reduces reward when there are many misses", () => {
    const perfect = replyReward("beginner", 40, 0, 20_000);
    const messy = replyReward("beginner", 40, 20, 20_000);
    expect(messy).toBeLessThan(perfect);
  });

  it("uses published multipliers", () => {
    expect(speedMultiplier(10)).toBe(0.7);
    expect(speedMultiplier(50)).toBe(1);
    expect(speedMultiplier(90)).toBe(1.2);
    expect(accuracyMultiplier(100)).toBe(1.15);
    expect(accuracyMultiplier(82)).toBe(0.85);
  });

  it("treats zero attempts as 100% accuracy", () => {
    expect(accuracyPercent(0, 0)).toBe(100);
  });

  it("never pays less than 1 man-yen", () => {
    expect(replyReward("advanced", 1, 40, 80_000)).toBeGreaterThanOrEqual(1);
  });
});
