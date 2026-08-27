const {
  decideClaim,
  canConfirmHandover,
  CLAIM_STATUS,
  CLAIM_ACTION,
} = require("../src/services/claimService");
const { MATCH_RESULT } = require("../src/services/matchingService");
const ValidationError = require("../src/errors/ValidationError");

describe("claimService: Decision Table Testing for claim approval logic", () => {
  // Rule 1: REJECT always rejects, regardless of evidence or match strength.
  test("Rule 1: REJECT -> REJECTED (evidence and match strength irrelevant)", () => {
    const result = decideClaim({
      action: CLAIM_ACTION.REJECT,
      hasEvidence: false,
      matchResult: MATCH_RESULT.WEAK,
    });
    expect(result.status).toBe(CLAIM_STATUS.REJECTED);
  });

  // Rule 2: REQUEST_INFO always asks for more info, regardless of current state.
  test("Rule 2: REQUEST_INFO -> INFO_REQUESTED (evidence and match strength irrelevant)", () => {
    const result = decideClaim({
      action: CLAIM_ACTION.REQUEST_INFO,
      hasEvidence: true,
      matchResult: MATCH_RESULT.STRONG,
      staffVerifiedEvidence: true,
    });
    expect(result.status).toBe(CLAIM_STATUS.INFO_REQUESTED);
  });

  // Rule 3: APPROVE without evidence is always rejected by the system, regardless of match strength.
  test.each([MATCH_RESULT.WEAK, MATCH_RESULT.POSSIBLE, MATCH_RESULT.STRONG])(
    "Rule 3: APPROVE with hasEvidence=false and matchResult=%s -> throws (evidence required)",
    (matchResult) => {
      expect(() =>
        decideClaim({ action: CLAIM_ACTION.APPROVE, hasEvidence: false, matchResult })
      ).toThrow(ValidationError);
    }
  );

  // Rule 4: APPROVE + evidence + Weak Match requires staff verification.
  test("Rule 4: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=false -> throws", () => {
    expect(() =>
      decideClaim({
        action: CLAIM_ACTION.APPROVE,
        hasEvidence: true,
        matchResult: MATCH_RESULT.WEAK,
        staffVerifiedEvidence: false,
      })
    ).toThrow(ValidationError);
  });

  // Rule 5: APPROVE + evidence + Weak Match + verified -> APPROVED.
  test("Rule 5: APPROVE, hasEvidence=true, matchResult=WEAK_MATCH, staffVerifiedEvidence=true -> APPROVED", () => {
    const result = decideClaim({
      action: CLAIM_ACTION.APPROVE,
      hasEvidence: true,
      matchResult: MATCH_RESULT.WEAK,
      staffVerifiedEvidence: true,
    });
    expect(result.status).toBe(CLAIM_STATUS.APPROVED);
  });

  // Rule 6: APPROVE + evidence + Possible/Strong Match -> APPROVED, verification not required.
  test.each([MATCH_RESULT.POSSIBLE, MATCH_RESULT.STRONG])(
    "Rule 6: APPROVE, hasEvidence=true, matchResult=%s, staffVerifiedEvidence=false -> APPROVED",
    (matchResult) => {
      const result = decideClaim({
        action: CLAIM_ACTION.APPROVE,
        hasEvidence: true,
        matchResult,
        staffVerifiedEvidence: false,
      });
      expect(result.status).toBe(CLAIM_STATUS.APPROVED);
    }
  );

  test("rejects an unknown action", () => {
    expect(() =>
      decideClaim({ action: "DELETE", hasEvidence: true, matchResult: MATCH_RESULT.STRONG })
    ).toThrow(ValidationError);
  });

  test("rejects an unknown matchResult", () => {
    expect(() =>
      decideClaim({ action: CLAIM_ACTION.APPROVE, hasEvidence: true, matchResult: "UNKNOWN" })
    ).toThrow(ValidationError);
  });
});

describe("claimService: handover eligibility (canConfirmHandover)", () => {
  test("allows handover when claim is APPROVED and identity is verified", () => {
    expect(
      canConfirmHandover({ status: CLAIM_STATUS.APPROVED, verifiedIdentity: true })
    ).toBe(true);
  });

  test.each([CLAIM_STATUS.PENDING, CLAIM_STATUS.REJECTED, CLAIM_STATUS.INFO_REQUESTED, CLAIM_STATUS.COMPLETED])(
    "rejects handover when status is %s, even with verified identity",
    (status) => {
      expect(() => canConfirmHandover({ status, verifiedIdentity: true })).toThrow(ValidationError);
    }
  );

  test("rejects handover when identity has not been verified", () => {
    expect(() =>
      canConfirmHandover({ status: CLAIM_STATUS.APPROVED, verifiedIdentity: false })
    ).toThrow(ValidationError);
  });
});
