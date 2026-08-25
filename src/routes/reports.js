const express = require("express");

const prisma = require("../config/prisma");
const { authContext } = require("../middleware/authContext");
const { upload } = require("../middleware/upload");
const { itemReportSchema } = require("../validation/itemReportSchema");
const { matchDecisionSchema } = require("../validation/matchDecisionSchema");
const { calculateMatchScore } = require("../services/matchingService");
const { NOTIFICATION_TYPE, buildNotificationMessage } = require("../services/notificationService");
const ValidationError = require("../errors/ValidationError");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { reportType, status } = req.query;

    const reports = await prisma.itemReport.findMany({
      where: {
        ...(reportType ? { reportType } : {}),
        ...(status ? { status } : {}),
      },
      include: { category: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

router.post("/", authContext, upload.single("photo"), async (req, res, next) => {
  try {
    const parsed = itemReportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid item report.",
        parsed.error.issues.map((issue) => issue.message)
      );
    }

    const report = await prisma.itemReport.create({
      data: {
        ...parsed.data,
        photoUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        createdById: req.user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "REPORT_CREATED",
        actorId: req.user.id,
        metadata: { reportId: report.id, reportType: report.reportType },
      },
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.post("/matches/decision", authContext, async (req, res, next) => {
  try {
    const parsed = matchDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(
        "Invalid match decision.",
        parsed.error.issues.map((issue) => issue.message)
      );
    }

    const { lostReportId, foundReportId, decision } = parsed.data;

    const lostReport = await prisma.itemReport.findUnique({ where: { id: lostReportId } });
    if (!lostReport) {
      return res.status(404).json({ success: false, message: "Lost report not found." });
    }

    const matchDecision = await prisma.matchDecision.upsert({
      where: { lostReportId_foundReportId: { lostReportId, foundReportId } },
      update: { decision, decidedById: req.user.id },
      create: { lostReportId, foundReportId, decision, decidedById: req.user.id },
    });

    if (decision === "CONFIRMED" && lostReport.createdById !== req.user.id) {
      await prisma.notification.create({
        data: {
          type: NOTIFICATION_TYPE.MATCH_CONFIRMED,
          message: buildNotificationMessage(NOTIFICATION_TYPE.MATCH_CONFIRMED, {
            itemTitle: lostReport.title,
          }),
          userId: lostReport.createdById,
          reportId: lostReport.id,
        },
      });
    }

    res.json({ success: true, data: matchDecision });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/matches", async (req, res, next) => {
  try {
    const report = await prisma.itemReport.findUnique({ where: { id: req.params.id } });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    const oppositeType = report.reportType === "LOST" ? "FOUND" : "LOST";
    const [candidates, decisions] = await Promise.all([
      prisma.itemReport.findMany({
        where: { reportType: oppositeType, status: "OPEN" },
      }),
      prisma.matchDecision.findMany({
        where:
          report.reportType === "LOST" ? { lostReportId: report.id } : { foundReportId: report.id },
      }),
    ]);

    const decisionByCandidateId = new Map(
      decisions.map((d) => [
        report.reportType === "LOST" ? d.foundReportId : d.lostReportId,
        d.decision,
      ])
    );

    const matches = candidates
      .filter((candidate) => decisionByCandidateId.get(candidate.id) !== "DISMISSED")
      .map((candidate) => {
        const [lostItem, foundItem] =
          report.reportType === "LOST" ? [report, candidate] : [candidate, report];
        const { score, result, breakdown } = calculateMatchScore(lostItem, foundItem);
        return {
          report: candidate,
          score,
          result,
          breakdown,
          matchDecision: decisionByCandidateId.get(candidate.id) ?? null,
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({ success: true, data: matches });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
