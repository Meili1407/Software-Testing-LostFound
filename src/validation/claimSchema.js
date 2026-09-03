const { z } = require("zod");

const claimSubmissionSchema = z.object({
  lostReportId: z.string().uuid("lostReportId must be a valid UUID"),
  foundReportId: z.string().uuid("foundReportId must be a valid UUID"),
  evidence: z.array(z.object({
    evidenceType: z.enum(["PHOTO", "RECEIPT", "SERIAL_NUMBER", "IDENTIFYING_MARKS"]),
    description: z.string().trim().min(5, "description must be at least 5 characters").max(2000),
    url: z.string().url().optional(),
  })).min(1, "At least one piece of evidence must be provided."),
});

const claimDecisionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_INFO"]),
  staffVerifiedEvidence: z.boolean().optional(),
});

module.exports = { claimSubmissionSchema, claimDecisionSchema };
