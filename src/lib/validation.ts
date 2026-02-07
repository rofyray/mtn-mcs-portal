import { ZodError } from "zod";

export function formatZodError(error: ZodError, maxMessages = 3): string {
  const messages = error.issues.map((issue) => {
    if (issue.message && issue.message !== "Required") {
      return issue.message;
    }
    // Fallback: derive readable name from field path
    const field = issue.path[issue.path.length - 1];
    if (field) {
      const readable = String(field)
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
      return `${readable} is required`;
    }
    return "Invalid input";
  });
  const unique = [...new Set(messages)].slice(0, maxMessages);
  if (unique.length < error.issues.length) {
    return unique.join(". ") + ` (and ${error.issues.length - unique.length} more).`;
  }
  return unique.join(". ") + ".";
}
