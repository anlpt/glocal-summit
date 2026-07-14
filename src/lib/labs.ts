/**
 * Split a verbatim Topic string into individual lab names.
 * Groups in the sheet join labs with " - " and occasionally ";".
 * The original Topic text is never mutated — this only derives the
 * selectable unit names.
 */
export function splitLabs(topic: string): string[] {
  if (!topic || !topic.trim()) return [];
  return topic
    .split(/\s*[-;]\s*/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
