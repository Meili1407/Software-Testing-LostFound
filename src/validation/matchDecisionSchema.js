const { z } = require("zod");

const matchDecisionSchema = z.object({
  lostReportId: z.string().uuid("lostReportId must be a valid UUID"),
  foundReportId: z.string().uuid("foundReportId must be a valid UUID"),
  decision: z.enum(["CONFIRMED", "DISMISSED"]),
});

module.exports = { matchDecisionSchema };
