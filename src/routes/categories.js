const express = require("express");

const prisma = require("../config/prisma");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.itemCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
