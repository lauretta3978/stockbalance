/**
 * Robust ISBN normalization and comparison utility
 */

export function normalizeIsbn(val: any): string {
  if (val === undefined || val === null) {
    return '';
  }

  let str = String(val).trim();

  // Handle leading/trailing quotes or apostrophes often added by spreadsheet exports
  str = str.replace(/^['"`]+|['"`]+$/g, '').trim();

  // Handle Excel scientific notation (e.g. 9.780123456789E+12)
  if (/^[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)$/.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num) && Number.isFinite(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {
      // fallback to original str
    }
  }

  // Remove common prefixes like 'ISBN:', 'ISBN-13:', 'ISBN-10:', 'ISBN '
  str = str.replace(/^ISBN(?:-?(?:10|13))?:?\s*/i, '');

  // Strip hyphens, spaces, periods, underscores, slashes
  str = str.replace(/[-\s._/]/g, '');

  // Keep uppercase for 'X' in ISBN-10 check digits
  return str.toUpperCase();
}

/**
 * Parses numeric quantity safely from string or number
 */
export function parseQuantity(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') {
    return fallback;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : Math.round(val);
  }
  const clean = String(val).replace(/,/g, '').trim();
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? fallback : Math.round(parsed);
}
