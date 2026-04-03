const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/**
 * Pull YYYY-MM-DD from messy text (ISO, US slash, "April 8, 2026", etc.).
 */
export function coerceToIsoDate(fragment: string): string | undefined {
  const s = fragment.trim();
  if (!s) return undefined;

  const iso = /\b(\d{4}-\d{2}-\d{2})\b/.exec(s);
  if (iso) return iso[1];

  const us = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(s);
  if (us) {
    const m = Number(us[1]);
    const d = Number(us[2]);
    const y = Number(us[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }

  const mdY =
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b/i.exec(
      s,
    );
  if (mdY) {
    const mon = MONTHS[mdY[1].toLowerCase().slice(0, 3)];
    if (mon !== undefined) {
      const dt = new Date(Date.UTC(Number(mdY[3]), mon, Number(mdY[2])));
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }

  const dMy =
    /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})\b/i.exec(
      s,
    );
  if (dMy) {
    const mon = MONTHS[dMy[2].toLowerCase().slice(0, 3)];
    if (mon !== undefined) {
      const dt = new Date(Date.UTC(Number(dMy[3]), mon, Number(dMy[1])));
      if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
    }
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);

  return undefined;
}
