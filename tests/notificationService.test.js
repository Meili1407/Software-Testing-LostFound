const {
  NOTIFICATION_TYPE,
  buildNotificationMessage,
} = require("../src/services/notificationService");
const ValidationError = require("../src/errors/ValidationError");

describe("notificationService: buildNotificationMessage", () => {
  test("MATCH_CONFIRMED mentions the lost item's title", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.MATCH_CONFIRMED, {
      itemTitle: "Black Backpack",
    });
    expect(message).toContain("Black Backpack");
    expect(message).toContain("match");
  });

  test("CLAIM_APPROVED mentions the item and handover", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_APPROVED, {
      itemTitle: "Black Backpack",
    });
    expect(message).toContain("approved");
    expect(message).toContain("handover");
  });

  test("CLAIM_REJECTED includes the reason when provided", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_REJECTED, {
      itemTitle: "Black Backpack",
      reason: "Evidence did not match.",
    });
    expect(message).toContain("rejected");
    expect(message).toContain("Evidence did not match.");
  });

  test("CLAIM_REJECTED omits the reason clause when none is provided", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_REJECTED, {
      itemTitle: "Black Backpack",
    });
    expect(message).not.toContain("Reason:");
  });

  test("CLAIM_INFO_REQUESTED mentions more information is needed", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.CLAIM_INFO_REQUESTED, {
      itemTitle: "Black Backpack",
    });
    expect(message).toContain("more information");
  });

  test("HANDOVER_READY mentions the claim is complete", () => {
    const message = buildNotificationMessage(NOTIFICATION_TYPE.HANDOVER_READY, {
      itemTitle: "Black Backpack",
    });
    expect(message).toContain("complete");
  });

  test("throws for an unknown notification type", () => {
    expect(() => buildNotificationMessage("UNKNOWN_TYPE", {})).toThrow(ValidationError);
  });
});
