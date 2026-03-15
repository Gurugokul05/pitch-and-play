const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      message: messages.length > 0 ? messages.join(", ") : "Validation failed",
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    return res.status(409).json({
      message: `A record with that ${field} already exists.`,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Server Error";

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
