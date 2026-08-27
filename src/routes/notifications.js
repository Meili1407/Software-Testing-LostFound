const express = require("express");

const prisma = require("../config/prisma");
const { authContext } = require("../middleware/authContext");

const router = express.Router();

router.get("/", authContext, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", authContext, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });

    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.patch("/read-all", authContext, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
