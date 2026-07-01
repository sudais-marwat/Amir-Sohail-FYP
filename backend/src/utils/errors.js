export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? "Unexpected server error" : err.message
  });
}
