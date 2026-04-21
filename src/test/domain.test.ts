import { describe, it, expect } from "vitest";
import { CHEST_COSTS } from "@/hooks/useGacha";
import { ACHIEVEMENTS_CATALOG } from "@/hooks/useHabits";

describe("Domain Logic - Gacha System", () => {
  it("should have correct chest costs", () => {
    expect(CHEST_COSTS.weekly).toBe(0);
    expect(CHEST_COSTS.premium).toBe(300);
    expect(CHEST_COSTS.legendary).toBe(800);
  });
});

describe("Domain Logic - Achievements", () => {
  it("should contain all required initial achievements", () => {
    const titles = ACHIEVEMENTS_CATALOG.map((a) => a.title);
    expect(titles).toContain("Primeira Missão");
    expect(titles).toContain("Sequência de 7");
    expect(titles).toContain("Centurião");
  });

  it("should have valid formatting for each achievement", () => {
    ACHIEVEMENTS_CATALOG.forEach(achievement => {
      expect(achievement).toHaveProperty("title");
      expect(achievement).toHaveProperty("description");
      expect(achievement).toHaveProperty("emoji");
    });
  });
});
