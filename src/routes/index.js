const express = require("express");

const reportsRouter = require("./reports");
const claimsRouter = require("./claims");
const categoriesRouter = require("./categories");
const usersRouter = require("./users");
const auditLogsRouter = require("./auditLogs");
const notificationsRouter = require("./notifications");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Campus Lost & Found backend is healthy",
    timestamp: new Date().toISOString()
  });
});

router.use("/reports", reportsRouter);
router.use("/claims", claimsRouter);
router.use("/categories", categoriesRouter);
router.use("/users", usersRouter);
router.use("/audit-logs", auditLogsRouter);
router.use("/notifications", notificationsRouter);

module.exports = router;