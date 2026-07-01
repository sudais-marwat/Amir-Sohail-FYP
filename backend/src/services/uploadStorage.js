import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

function safeName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function saveUpload(file) {
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "uploads");
  await mkdir(uploadRoot, { recursive: true });
  const fileName = `${uuid()}-${safeName(file.originalname || "document.txt")}`;
  const filePath = path.join(uploadRoot, fileName);
  await writeFile(filePath, file.buffer);
  return filePath;
}
