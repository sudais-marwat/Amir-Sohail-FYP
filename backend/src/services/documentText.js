import mammoth from "mammoth";
import pdf from "pdf-parse";

export async function extractDocumentText(file) {
  const name = file.originalname.toLowerCase();

  if (file.mimetype === "application/pdf" || name.endsWith(".pdf")) {
    const parsed = await pdf(file.buffer);
    return parsed.text;
  }

  if (
    file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const parsed = await mammoth.extractRawText({ buffer: file.buffer });
    return parsed.value;
  }

  return file.buffer.toString("utf8");
}
