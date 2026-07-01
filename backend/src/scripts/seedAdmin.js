import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = process.env.ADMIN_EMAIL || "admin@hadaf.edu.pk";
const password = process.env.ADMIN_PASSWORD || "admin12345";
const passwordHash = await bcrypt.hash(password, 10);

await pool.query(
  `
  insert into admin_users(name, email, password_hash, role)
  values($1, $2, $3, 'admin')
  on conflict(email)
  do update set password_hash = excluded.password_hash
  `,
  ["Hadaf Admin", email, passwordHash]
);

await pool.end();
console.log(`Admin ready: ${email}`);
