import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { store } from "../db/store.js";
import { HttpError } from "../utils/errors.js";

export const authRouter = express.Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").toLowerCase();
    const password = String(req.body.password || "");
    const admin = await store.findAdminByEmail(email);

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "8h" }
    );

    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    next(err);
  }
});
