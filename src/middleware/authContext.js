const prisma = require("../config/prisma");

async function authContext(req, res, next) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({ success: false, message: "Missing x-user-id header." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: "Unknown user." });
  }

  req.user = { id: user.id, role: user.role.name };
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = { authContext, requireRole };
