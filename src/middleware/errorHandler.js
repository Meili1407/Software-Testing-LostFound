function errorHandler(error, req, res, next) {
    console.error(error);

    res.status(error.statusCode || error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      ...(error.details ? { details: error.details } : {})
    });
  }

  module.exports = errorHandler;