import jwt from "jsonwebtoken";
import { HttpError } from "../utils/errors.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return next(new HttpError(401, "Authentication required"));

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired session"));
  }
}
