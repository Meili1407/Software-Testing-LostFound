const ValidationError = require("../errors/ValidationError");
const { MATCH_RESULT } = require("./matchingService");

const CLAIM_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  INFO_REQUESTED: "INFO_REQUESTED",
  COMPLETED: "COMPLETED",
};

const CLAIM_ACTION = {
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REQUEST_INFO: "REQUEST_INFO",
};

const VALID_ACTIONS = Object.values(CLAIM_ACTION);
const VALID_MATCH_RESULTS = Object.values(MATCH_RESULT);

/**
 * Decision table for claim approval:
 *
 * | Action       | hasEvidence | matchResult  | staffVerifiedEvidence | Outcome                              |
 * |--------------|-------------|--------------|------------------------|---------------------------------------|
 * | REJECT       | -           | -            | -                       | REJECTED                              |
 * | REQUEST_INFO | -           | -            | -                       | INFO_REQUESTED                        |
 * | APPROVE      | false       | -            | -                       | error: evidence required              |
 * | APPROVE      | true        | WEAK_MATCH   | false                   | error: verification required          |
 * | APPROVE      | true        | WEAK_MATCH   | true                    | APPROVED                              |
 * | APPROVE      | true        | POSSIBLE/STRONG | true or false        | APPROVED                              |
 */
function decideClaim({ action, hasEvidence, matchResult, staffVerifiedEvidence = false }) {
  if (!VALID_ACTIONS.includes(action)) {
    throw new ValidationError(`Invalid claim action: ${action}`);
  }

  if (!VALID_MATCH_RESULTS.includes(matchResult)) {
    throw new ValidationError(`Invalid match result: ${matchResult}`);
  }

  if (action === CLAIM_ACTION.REJECT) {
    return { status: CLAIM_STATUS.REJECTED, reason: "Staff rejected the claim." };
  }

  if (action === CLAIM_ACTION.REQUEST_INFO) {
    return {
      status: CLAIM_STATUS.INFO_REQUESTED,
      reason: "Staff requested additional information.",
    };
  }

  if (!hasEvidence) {
    throw new ValidationError("Cannot approve a claim without supporting evidence.");
  }

  if (matchResult === MATCH_RESULT.WEAK && !staffVerifiedEvidence) {
    throw new ValidationError(
      "Weak match claims require staff-verified evidence before approval."
    );
  }

  return { status: CLAIM_STATUS.APPROVED, reason: "Claim approved after evidence verification." };
}

/**
 * A handover can only be confirmed once a claim has been approved (but not yet
 * completed) and staff have verified the claimant's identity in person.
 */
function canConfirmHandover({ status, verifiedIdentity }) {
  if (status !== CLAIM_STATUS.APPROVED) {
    throw new ValidationError(
      `Cannot confirm handover for a claim with status ${status}; it must be APPROVED first.`
    );
  }

  if (!verifiedIdentity) {
    throw new ValidationError("Staff must verify the claimant's identity before handover.");
  }

  return true;
}

module.exports = {
  CLAIM_STATUS,
  CLAIM_ACTION,
  decideClaim,
  canConfirmHandover,
};
