'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/**
 * Write rows (array of objects) as CSV.
 * If columns is provided, use that order; otherwise use keys of first row.
 * Returns the absolute path of the written file.
 */
function writeCsv(filePath, rows, columns) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const cols = columns || (rows[0] ? Object.keys(rows[0]) : []);
  const header = cols.map(csvEscape).join(',');
  const lines = [header];
  for (const row of rows) {
    lines.push(cols.map(c => csvEscape(row[c])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  return path.resolve(filePath);
}

/**
 * Compute SHA-256 of a file and write a sidecar `<filePath>.sha256` containing
 * `<hex>  <basename>` (matching shasum format).
 */
function writeSha256Sidecar(filePath) {
  const buf = fs.readFileSync(filePath);
  const hex = crypto.createHash('sha256').update(buf).digest('hex');
  const sidecar = filePath + '.sha256';
  fs.writeFileSync(sidecar, `${hex}  ${path.basename(filePath)}\n`, 'utf8');
  return { hex, sidecar };
}

module.exports = { writeCsv, writeSha256Sidecar };
