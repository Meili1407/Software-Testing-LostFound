const express = require("express");

const prisma = require("../config/prisma");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: { role: true },
      orderBy: { displayName: "asc" },
    });
    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        role: user.role.name,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
