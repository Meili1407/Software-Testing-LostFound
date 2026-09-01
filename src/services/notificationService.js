const ValidationError = require("../errors/ValidationError");

const NOTIFICATION_TYPE = {
  MATCH_CONFIRMED: "MATCH_CONFIRMED",
  CLAIM_APPROVED: "CLAIM_APPROVED",
  CLAIM_REJECTED: "CLAIM_REJECTED",
  CLAIM_INFO_REQUESTED: "CLAIM_INFO_REQUESTED",
  HANDOVER_READY: "HANDOVER_READY",
};

function buildNotificationMessage(type, context = {}) {
  switch (type) {
    case NOTIFICATION_TYPE.MATCH_CONFIRMED:
      return `A possible match was confirmed for your lost item "${context.itemTitle}".`;
    case NOTIFICATION_TYPE.CLAIM_APPROVED:
      return `Your claim for "${context.itemTitle}" was approved. Staff will arrange a handover.`;
    case NOTIFICATION_TYPE.CLAIM_REJECTED:
      return `Your claim for "${context.itemTitle}" was rejected.${
        context.reason ? ` Reason: ${context.reason}` : ""
      }`;
    case NOTIFICATION_TYPE.CLAIM_INFO_REQUESTED:
      return `Staff requested more information for your claim on "${context.itemTitle}".`;
    case NOTIFICATION_TYPE.HANDOVER_READY:
      return `Handover confirmed for "${context.itemTitle}". Your claim is now complete.`;
    default:
      throw new ValidationError(`Unknown notification type: ${type}`);
  }
}

module.exports = { NOTIFICATION_TYPE, buildNotificationMessage };
