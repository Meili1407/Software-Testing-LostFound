const express = require("express");

const prisma = require("../config/prisma");
const { authContext, requireRole } = require("../middleware/authContext");
const { claimSubmissionSchema, claimDecisionSchema } = require("../validation/claimSchema");
const { calculateMatchScore, classifyScore } = require("../services/matchingService");
const { decideClaim, canConfirmHandover } = require("../services/claimService");
const { NOTIFICATION_TYPE, buildNotificationMessage } = require("../services/notificationService");
const { formatClaimCode, parseClaimCode } = require("../utils/claimCode");
const ValidationError = require("../errors/ValidationError");

const router = express.Router();

const claimInclude = {
  lostReport: true,
  foundReport: true,
  claimant: true,
  decidedBy: true,
};

function withCode(claim) {
  return { ...claim, code: formatClaimCode(claim.claimNumber) };
}

router.get("/", authContext, async (req, res, next) => {
  try {
    const { status } = req.query;

    const claims = await prisma.claim.findMany({
      where: status ? { status } : {},
      include: claimInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: claims.map(withCode) });
  } catch (error) {
    next(error);
  }
});

router.get("/by-code/:code", authContext, async (req, res, next) => {
  try {
    const claimNumber = parseClaimCode(req.params.code);
    if (claimNumber === null) {
      return res.status(400).json({ success: false, message: "Invalid claim code." });
    }

    const claim = await prisma.claim.findFirst({
      where: { claimNumber },
      include: claimInclude,
    });

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found." });
    }

    res.json({ success: true, data: withCode(claim) });
  } catch (error) {
    next(error);
  }
});

router.post("/", authContext, async (req, res, next) => {
  try {
    const parsed = claimSubmissionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid claim submission.",
        parsed.error.issues.map((issue) => issue.message)
      );
    }

    const { lostReportId, foundReportId, evidenceDescription } = parsed.data;

    const [lostReport, foundReport] = await Promise.all([
      prisma.itemReport.findUnique({ where: { id: lostReportId } }),
      prisma.itemReport.findUnique({ where: { id: foundReportId } }),
    ]);

    if (!lostReport || !foundReport) {
      return res.status(404).json({ success: false, message: "Lost or found report not found." });
    }

    const { score } = calculateMatchScore(lostReport, foundReport);

    const claim = await prisma.claim.create({
      data: {
        lostReportId,
        foundReportId,
        claimantId: req.user.id,
        evidenceDescription,
        matchScore: score,
      },
      include: claimInclude,
    });

    await prisma.itemReport.updateMany({
      where: { id: { in: [lostReportId, foundReportId] }, status: "OPEN" },
      data: { status: "CLAIM_IN_PROGRESS" },
    });

    await prisma.auditLog.create({
      data: {
        action: "CLAIM_SUBMITTED",
        actorId: req.user.id,
        claimId: claim.id,
        metadata: { matchScore: score },
      },
    });

    res.status(201).json({ success: true, data: withCode(claim) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authContext, async (req, res, next) => {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: req.params.id },
      include: claimInclude,
    });

    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found." });
    }

    res.json({ success: true, data: withCode(claim) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/decision", authContext, requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const parsed = claimDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid claim decision.",
        parsed.error.issues.map((issue) => issue.message)
      );
    }

    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found." });
    }

    const { action, staffVerifiedEvidence = false } = parsed.data;
    const matchResult = classifyScore(claim.matchScore);
    const hasEvidence = Boolean(claim.evidenceDescription && claim.evidenceDescription.trim());

    const decision = decideClaim({ action, hasEvidence, matchResult, staffVerifiedEvidence });

    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: decision.status,
        decisionReason: decision.reason,
        staffVerifiedEvidence,
        decidedById: req.user.id,
        decidedAt: new Date(),
      },
      include: claimInclude,
    });

    if (decision.status === "REJECTED") {
      await prisma.itemReport.updateMany({
        where: { id: { in: [claim.lostReportId, claim.foundReportId] } },
        data: { status: "OPEN" },
      });
    }

    await prisma.auditLog.create({
      data: {
        action: "CLAIM_DECIDED",
        actorId: req.user.id,
        claimId: claim.id,
        metadata: { action, status: decision.status },
      },
    });

    const notificationType = {
      APPROVED: NOTIFICATION_TYPE.CLAIM_APPROVED,
      REJECTED: NOTIFICATION_TYPE.CLAIM_REJECTED,
      INFO_REQUESTED: NOTIFICATION_TYPE.CLAIM_INFO_REQUESTED,
    }[decision.status];

    if (notificationType) {
      await prisma.notification.create({
        data: {
          type: notificationType,
          message: buildNotificationMessage(notificationType, {
            itemTitle: updated.lostReport.title,
            reason: decision.reason,
          }),
          userId: updated.claimantId,
          claimId: updated.id,
        },
      });
    }

    res.json({ success: true, data: withCode(updated) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/handover", authContext, requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const verifiedIdentity = Boolean(req.body?.verifiedIdentity);

    const claim = await prisma.claim.findUnique({ where: { id: req.params.id }, include: claimInclude });
    if (!claim) {
      return res.status(404).json({ success: false, message: "Claim not found." });
    }

    canConfirmHandover({ status: claim.status, verifiedIdentity });

    const updated = await prisma.claim.update({
      where: { id: claim.id },
      data: {
        status: "COMPLETED",
        handoverVerifiedIdentity: verifiedIdentity,
        handoverConfirmedAt: new Date(),
        handoverConfirmedById: req.user.id,
      },
      include: claimInclude,
    });

    await prisma.itemReport.updateMany({
      where: { id: { in: [claim.lostReportId, claim.foundReportId] } },
      data: { status: "RESOLVED" },
    });

    await prisma.auditLog.create({
      data: {
        action: "HANDOVER_COMPLETED",
        actorId: req.user.id,
        claimId: claim.id,
        metadata: { verifiedIdentity },
      },
    });

    await prisma.notification.create({
      data: {
        type: NOTIFICATION_TYPE.HANDOVER_READY,
        message: buildNotificationMessage(NOTIFICATION_TYPE.HANDOVER_READY, {
          itemTitle: claim.lostReport.title,
        }),
        userId: claim.claimantId,
        claimId: claim.id,
      },
    });

    res.json({ success: true, data: withCode(updated) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
