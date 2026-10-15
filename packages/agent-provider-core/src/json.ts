const MAX_SUMMARY_LENGTH = 2000;

export const summarizeText = (value: unknown, fallback: string): string => {
  const text = typeof value === 'string' ? value.trim() || fallback : fallback;
  return text.length <= MAX_SUMMARY_LENGTH
    ? text
    : `${text.slice(0, MAX_SUMMARY_LENGTH - 3)}...`;
};

export const extractJson = (message: string): unknown => {
  const trimmed = message.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const objectStart = withoutFence.indexOf('{');
  const arrayStart = withoutFence.indexOf('[');
  const start =
    objectStart < 0
      ? arrayStart
      : arrayStart < 0
        ? objectStart
        : Math.min(objectStart, arrayStart);
  const end =
    start < 0
      ? -1
      : withoutFence.lastIndexOf(withoutFence[start] === '{' ? '}' : ']');

  const candidates = [
    trimmed,
    withoutFence,
    start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error('Final message is not valid JSON.');
};
