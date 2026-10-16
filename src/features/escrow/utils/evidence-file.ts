const MAX_EVIDENCE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
};

export function validateEvidenceFile(file: Pick<File, "name" | "type" | "size">): string | null {
  if (file.size > MAX_EVIDENCE_SIZE) return "Evidence files must be 10 MB or smaller.";
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExtensions = ALLOWED_TYPES[file.type];
  if (!allowedExtensions) return "Choose a JPG, PNG, WEBP, or PDF file.";
  if (!allowedExtensions.includes(extension)) return "The file extension does not match its content type.";
  return null;
}
