const { itemReportSchema } = require("../src/validation/itemReportSchema");
const { claimSubmissionSchema, claimDecisionSchema } = require("../src/validation/claimSchema");

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const VALID_UUID_2 = "22222222-2222-4222-8222-222222222222";

function validItemReport(overrides = {}) {
  return {
    title: "Black Backpack",
    description: "A black leather backpack lost near the library",
    reportType: "LOST",
    location: "Library 2nd Floor",
    occurredAt: "2026-08-10",
    color: "Black",
    brand: "Herschel",
    categoryId: VALID_UUID,
    ...overrides,
  };
}

describe("itemReportSchema: Equivalence Partitioning (item reporting)", () => {
  test("valid partition: accepts a fully valid report", () => {
    expect(itemReportSchema.safeParse(validItemReport()).success).toBe(true);
  });

  test("valid partition: accepts a report without optional color/brand", () => {
    const { color, brand, ...rest } = validItemReport();
    expect(itemReportSchema.safeParse(rest).success).toBe(true);
  });

  test.each(["title", "description", "location"])(
    "invalid partition: rejects an empty required string field %s",
    (field) => {
      const result = itemReportSchema.safeParse(validItemReport({ [field]: "" }));
      expect(result.success).toBe(false);
    }
  );

  test("invalid partition: rejects an unknown reportType", () => {
    const result = itemReportSchema.safeParse(validItemReport({ reportType: "MISSING" }));
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects a malformed occurredAt", () => {
    const result = itemReportSchema.safeParse(validItemReport({ occurredAt: "not-a-date" }));
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects a non-UUID categoryId", () => {
    const result = itemReportSchema.safeParse(validItemReport({ categoryId: "not-a-uuid" }));
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects a title over the max length", () => {
    const result = itemReportSchema.safeParse(validItemReport({ title: "x".repeat(121) }));
    expect(result.success).toBe(false);
  });
});

describe("claimSubmissionSchema: Equivalence Partitioning (claim submission)", () => {
  function validClaim(overrides = {}) {
    return {
      lostReportId: VALID_UUID,
      foundReportId: VALID_UUID_2,
      evidence: [{
        evidenceType: "PHOTO",
        description: "A picture of my backpack",
        url: "http://example.com/photo.jpg"
      }],
      ...overrides,
    };
  }

  test("valid partition: accepts a well-formed claim submission", () => {
    expect(claimSubmissionSchema.safeParse(validClaim()).success).toBe(true);
  });

  test("invalid partition: rejects evidence description shorter than 5 characters", () => {
    const result = claimSubmissionSchema.safeParse(validClaim({ evidence: [{ evidenceType: "PHOTO", description: "too" }] }));
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects a non-UUID lostReportId", () => {
    const result = claimSubmissionSchema.safeParse(validClaim({ lostReportId: "123" }));
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects missing evidence array", () => {
    const { evidence, ...rest } = validClaim();
    const result = claimSubmissionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  test("invalid partition: rejects invalid evidenceType", () => {
    const result = claimSubmissionSchema.safeParse(validClaim({ evidence: [{ evidenceType: "INVALID_TYPE", description: "A description" }] }));
    expect(result.success).toBe(false);
  });

  test("valid partition: accepts multiple evidence items", () => {
    const result = claimSubmissionSchema.safeParse(validClaim({ 
      evidence: [
        { evidenceType: "PHOTO", description: "A picture of my backpack" },
        { evidenceType: "RECEIPT", description: "Purchase receipt for the backpack" }
      ]
    }));
    expect(result.success).toBe(true);
  });
});

describe("claimDecisionSchema: Equivalence Partitioning (staff claim decision)", () => {
  test.each(["APPROVE", "REJECT", "REQUEST_INFO"])("valid partition: accepts action %s", (action) => {
    expect(claimDecisionSchema.safeParse({ action }).success).toBe(true);
  });

  test("invalid partition: rejects an unknown action", () => {
    expect(claimDecisionSchema.safeParse({ action: "DELETE" }).success).toBe(false);
  });
});
