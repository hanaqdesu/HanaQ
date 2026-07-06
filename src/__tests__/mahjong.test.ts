import { describe, expect, it } from "vitest";
import {
  calculateAdjustedPoint,
  calculateRanks,
  calculateUma,
  validateScores
} from "../lib/mahjong";
import { RawResult } from "../types";

function raw(scoreBySeat: Record<"east" | "south" | "west", number>): RawResult[] {
  return [
    { playerId: "east", playerNameSnapshot: "东家", seat: "east", score: scoreBySeat.east },
    { playerId: "south", playerNameSnapshot: "南家", seat: "south", score: scoreBySeat.south },
    { playerId: "west", playerNameSnapshot: "西家", seat: "west", score: scoreBySeat.west }
  ];
}

describe("validateScores", () => {
  it("accepts valid totals and score steps", () => {
    expect(validateScores([35000, 35000, 35000]).valid).toBe(true);
    expect(validateScores([40000, 35000, 30000]).valid).toBe(true);
    expect(validateScores([40000, 40000, 25000]).valid).toBe(true);
  });

  it("rejects invalid step and invalid total", () => {
    expect(validateScores([40500, 35000, 29500]).valid).toBe(false);
    expect(validateScores([50000, 30000, 20000]).valid).toBe(false);
  });
});

describe("calculateRanks", () => {
  it("orders three equal scores by east, south, west", () => {
    const ranked = calculateRanks(raw({ east: 35000, south: 35000, west: 35000 }));
    expect(ranked.find((result) => result.seat === "east")?.rank).toBe(1);
    expect(ranked.find((result) => result.seat === "south")?.rank).toBe(2);
    expect(ranked.find((result) => result.seat === "west")?.rank).toBe(3);
  });

  it("orders tied first scores by seat priority", () => {
    const ranked = calculateRanks(raw({ east: 40000, south: 40000, west: 25000 }));
    expect(ranked.find((result) => result.seat === "east")?.rank).toBe(1);
    expect(ranked.find((result) => result.seat === "south")?.rank).toBe(2);
    expect(ranked.find((result) => result.seat === "west")?.rank).toBe(3);
  });

  it("orders non-adjacent tie by seat priority after the winner", () => {
    const ranked = calculateRanks(raw({ east: 30000, south: 45000, west: 30000 }));
    expect(ranked.find((result) => result.seat === "south")?.rank).toBe(1);
    expect(ranked.find((result) => result.seat === "east")?.rank).toBe(2);
    expect(ranked.find((result) => result.seat === "west")?.rank).toBe(3);
  });
});

describe("uma and adjusted points", () => {
  it("uses the configured uma values", () => {
    expect(calculateUma(1)).toBe(20);
    expect(calculateUma(2)).toBe(0);
    expect(calculateUma(3)).toBe(-20);
  });

  it("calculates adjusted points and keeps a game zero-sum", () => {
    expect(calculateAdjustedPoint(45000, 20)).toBe(30);
    expect(calculateAdjustedPoint(35000, 0)).toBe(0);
    expect(calculateAdjustedPoint(25000, -20)).toBe(-30);

    const ranked = calculateRanks(raw({ east: 45000, south: 35000, west: 25000 }));
    const total = ranked.reduce((sum, result) => sum + result.adjustedPoint, 0);
    expect(total).toBe(0);
  });
});
