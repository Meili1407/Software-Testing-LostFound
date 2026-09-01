const {
  calculateMatchScore,
  classifyScore,
  validateItemForMatching,
  scoreItemName,
  scoreDescription,
  scoreExactOptionalField,
  scoreLocation,
  scoreDate,
  MATCH_RESULT,
  WEIGHTS,
} = require("../src/services/matchingService");
const ValidationError = require("../src/errors/ValidationError");

function makeItem(overrides = {}) {
  return {
    title: "Black Backpack",
    description: "A black leather backpack with a small tear on the front pocket",
    location: "Library 2nd Floor",
    occurredAt: "2026-08-10",
    color: "Black",
    brand: "Herschel",
    ...overrides,
  };
}

describe("matchingService: unit tests for attribute scorers", () => {
  test("scoreItemName gives full weight for an exact match (case/whitespace insensitive)", () => {
    expect(scoreItemName("Black Backpack", "  black backpack  ")).toBe(WEIGHTS.itemName);
  });

  test("scoreItemName gives partial credit when one name contains the other", () => {
    expect(scoreItemName("Backpack", "Black Backpack")).toBe(Math.round(WEIGHTS.itemName * 0.6));
  });

  test("scoreItemName gives zero for unrelated names", () => {
    expect(scoreItemName("Backpack", "Umbrella")).toBe(0);
  });

  test("scoreItemName gives zero when either name is empty", () => {
    expect(scoreItemName("", "Backpack")).toBe(0);
    expect(scoreItemName("Backpack", undefined)).toBe(0);
  });

  test("scoreDescription scales with word overlap (Jaccard similarity)", () => {
    const full = scoreDescription("black leather backpack torn pocket", "black leather backpack torn pocket");
    const none = scoreDescription("black leather backpack", "red umbrella broken handle");
    const partial = scoreDescription("black leather backpack torn pocket", "black leather backpack");

    expect(full).toBe(WEIGHTS.description);
    expect(none).toBe(0);
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(WEIGHTS.description);
  });

  test("scoreExactOptionalField matches case-insensitively and rewards exact match only", () => {
    expect(scoreExactOptionalField("Black", "black", WEIGHTS.color)).toBe(WEIGHTS.color);
    expect(scoreExactOptionalField("Black", "Red", WEIGHTS.color)).toBe(0);
  });

  test("scoreExactOptionalField gives zero when a field is missing on either side", () => {
    expect(scoreExactOptionalField(undefined, "Black", WEIGHTS.color)).toBe(0);
    expect(scoreExactOptionalField("Black", "", WEIGHTS.color)).toBe(0);
  });

  test("scoreLocation gives full weight for exact match and partial credit for containment", () => {
    expect(scoreLocation("Library 2nd Floor", "library 2nd floor")).toBe(WEIGHTS.location);
    expect(scoreLocation("Library", "Library 2nd Floor")).toBe(Math.round(WEIGHTS.location * 0.5));
    expect(scoreLocation("Library", "Gymnasium")).toBe(0);
  });

  test("scoreDate: boundary values at 0, 3, and 4 days apart", () => {
    expect(scoreDate("2026-08-10", "2026-08-10")).toBe(WEIGHTS.date);
    expect(scoreDate("2026-08-10", "2026-08-13")).toBe(Math.round(WEIGHTS.date * 0.5));
    expect(scoreDate("2026-08-10", "2026-08-14")).toBe(0);
  });
});

describe("matchingService: Boundary Value Analysis on decision thresholds", () => {
  test.each([
    [0, MATCH_RESULT.WEAK],
    [49, MATCH_RESULT.WEAK],
    [50, MATCH_RESULT.POSSIBLE],
    [74, MATCH_RESULT.POSSIBLE],
    [75, MATCH_RESULT.STRONG],
    [100, MATCH_RESULT.STRONG],
  ])("classifyScore(%i) -> %s", (score, expected) => {
    expect(classifyScore(score)).toBe(expected);
  });
});

describe("matchingService: Equivalence Partitioning on item validation", () => {
  test("accepts a fully valid item", () => {
    expect(() => validateItemForMatching(makeItem(), "lost")).not.toThrow();
  });

  test.each(["title", "description", "location", "occurredAt"])(
    "rejects an item missing required field %s",
    (field) => {
      const item = makeItem({ [field]: undefined });
      expect(() => validateItemForMatching(item, "lost")).toThrow(ValidationError);
    }
  );

  test("rejects an item with an invalid occurredAt value", () => {
    const item = makeItem({ occurredAt: "not-a-date" });
    expect(() => validateItemForMatching(item, "lost")).toThrow(ValidationError);
  });

  test("accepts an item with optional fields (color/brand) omitted", () => {
    const item = makeItem({ color: undefined, brand: undefined });
    expect(() => validateItemForMatching(item, "lost")).not.toThrow();
  });

  test("rejects a non-object item", () => {
    expect(() => validateItemForMatching(null, "lost")).toThrow(ValidationError);
  });
});

describe("matchingService: calculateMatchScore integration", () => {
  test("identical items produce a perfect score and Strong Match", () => {
    const lost = makeItem();
    const found = makeItem();

    const result = calculateMatchScore(lost, found);

    expect(result.score).toBe(100);
    expect(result.result).toBe(MATCH_RESULT.STRONG);
    expect(result.breakdown).toEqual({
      itemName: 25,
      description: 25,
      color: 15,
      brand: 15,
      location: 10,
      date: 10,
    });
  });

  test("completely unrelated items produce a low score and Weak Match", () => {
    const lost = makeItem();
    const found = makeItem({
      title: "Blue Umbrella",
      description: "A blue umbrella with a wooden handle",
      location: "Gymnasium",
      occurredAt: "2026-01-01",
      color: "Blue",
      brand: "Totes",
    });

    const result = calculateMatchScore(lost, found);

    expect(result.score).toBeLessThan(50);
    expect(result.result).toBe(MATCH_RESULT.WEAK);
  });

  test("partially matching items land in the Possible Match band", () => {
    const lost = makeItem();
    const found = makeItem({
      color: "Blue",
      brand: undefined,
      occurredAt: "2026-08-13",
    });

    const result = calculateMatchScore(lost, found);

    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThan(75);
    expect(result.result).toBe(MATCH_RESULT.POSSIBLE);
  });

  test("propagates validation errors for an invalid found item", () => {
    expect(() => calculateMatchScore(makeItem(), makeItem({ title: "" }))).toThrow(
      ValidationError
    );
  });
});
