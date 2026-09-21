export function formatDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

export const wordCount = (text) => (text.trim().match(/\S+/g) ?? []).length;

export const readingTime = (words) => Math.max(1, Math.round(words / 220));

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "research";

// Finds a "8/10" style score in the critic's text, if there is one.
export function extractScore(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10\b/);
  if (!match) return null;
  return parseFloat(match[1]) <= 10 ? match[1] : null;
}
