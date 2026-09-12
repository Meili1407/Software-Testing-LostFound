function errorHandler(error, req, res, next) {
    console.error(error);

    // A malformed :id route param (not a valid UUID) reaches Prisma as a raw
    // DB type error, not a validation error — treat it as "not found" rather
    // than leaking a 500 for what is really a bad request.
    if (error.code === "P2023" || error.code === "P2007") {
      return res.status(404).json({ success: false, message: "Resource not found." });
    }

    res.status(error.statusCode || error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      ...(error.details ? { details: error.details } : {})
    });
  }

  module.exports = errorHandler;