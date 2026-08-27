const { z } = require("zod");

const claimSubmissionSchema = z.object({
  lostReportId: z.string().uuid("lostReportId must be a valid UUID"),
  foundReportId: z.string().uuid("foundReportId must be a valid UUID"),
  evidenceDescription: z
    .string()
    .trim()
    .min(10, "evidenceDescription must be at least 10 characters")
    .max(2000),
});

const claimDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_INFO"]),
  staffVerifiedEvidence: z.boolean().optional(),
});

module.exports = { claimSubmissionSchema, claimDecisionSchema };
