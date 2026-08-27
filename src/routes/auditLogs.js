const express = require("express");

const prisma = require("../config/prisma");
const { authContext, requireRole } = require("../middleware/authContext");

const router = express.Router();

router.get("/", authContext, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { action } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: action ? { action } : {},
      include: {
        actor: { select: { id: true, displayName: true, email: true } },
        claim: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
