/**
 * CSV parser matching SofiaBusDock logic: header row → rows of key-value objects.
 * Handles quoted fields and multiple encodings.
 */

import { parse } from 'csv-parse/sync';

const CANDIDATE_ENCODINGS = ['utf8', 'win1251', 'win1250', 'latin1'];

/**
 * @param {Buffer} data
 * @returns {string}
 */
function decodeString(data) {
  for (const enc of CANDIDATE_ENCODINGS) {
    try {
      return data.toString(enc);
    } catch {
      continue;
    }
  }
  return data.toString('utf8');
}

/**
 * @param {Buffer|string} data - Raw CSV data (buffer or string)
 * @returns {{ headers: string[], rows: Record<string, string>[] }}
 */
export function parseCSV(data) {
  const str = Buffer.isBuffer(data) ? decodeString(data) : data;
  const records = parse(str, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  });
  const headers = records.length ? Object.keys(records[0]) : [];
  const rows = records.map((row) => ({ ...row }));
  return { headers, rows };
}
