#!/usr/bin/env node
'use strict';

/**
 * scripts/02_export_tagged_contacts.js
 *
 * Bulk export of CRM Contacts currently tagged "FCA Update Promo".
 *
 * Strategy:
 *   1. Try COQL first (preferred — produces a frozen SQL artefact that can
 *      go in front of the FCA verbatim).
 *   2. If COQL rejects the tag filter (CRM v8 COQL does not natively support
 *      Tag.name as a queryable field), fall back to the v8 criteria-Search
 *      endpoint, which DOES support Tag.name and is what produced the
 *      authoritative count of 2,818 in the FC-FCA-01 evidence pack.
 *
 * Either path produces:
 *   evidence/2026-04-25_fca-promo-oct2025/master_recipients_2025-10-16.csv
 *   evidence/2026-04-25_fca-promo-oct2025/master_recipients_2025-10-16.csv.sha256
 *   evidence/2026-04-25_fca-promo-oct2025/source_queries/06_query_used.txt
 *
 * Required env (loaded from scripts/.env):
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_DC=eu
 */

const path = require('path');
const fs = require('fs');
const { getAccessToken } = require('./lib/zohoAuth');
const { coqlPaginate, searchByCriteria, bulkReadCsv } = require('./lib/zohoCrm');
const { writeCsv, writeSha256Sidecar } = require('./lib/csvWriter');

const TAG = 'FCA Update Promo';
const CAMPAIGN = 'Important Update Regarding Promotions';
const EMAIL_SUBJECT = 'FIAR - Important Update Regarding Promotions';
const SEND_DATE = '2025-10-16';

const EVIDENCE_DIR = path.join(__dirname, '..', 'evidence', '2026-04-25_fca-promo-oct2025');
const CSV_PATH = path.join(EVIDENCE_DIR, 'master_recipients_2025-10-16.csv');
const QUERY_FROZEN_PATH = path.join(EVIDENCE_DIR, 'source_queries', '06_query_used.txt');

const COQL_SQL = `SELECT id, Email, First_Name, Last_Name, Created_Time
FROM Contacts
WHERE Tag.name = '${TAG}'
ORDER BY id ASC`;

const SEARCH_CRITERIA = `(Tag.name:equals:${TAG})`;
const SEARCH_FIELDS = 'id,Email,First_Name,Last_Name,Created_Time';

const CSV_COLUMNS = [
  'Record_ID', 'First_Name', 'Last_Name', 'Email',
  'Tag', 'Campaign', 'Email_Subject', 'Send_Date', 'Created_Time',
];

function shapeRow(rec) {
  return {
    Record_ID: rec.id,
    First_Name: rec.First_Name || '',
    Last_Name: rec.Last_Name || '',
    Email: rec.Email || '',
    Tag: TAG,
    Campaign: CAMPAIGN,
    Email_Subject: EMAIL_SUBJECT,
    Send_Date: SEND_DATE,
    Created_Time: rec.Created_Time || '',
  };
}

async function tryCoql(authCtx) {
  console.log('[1/2] Attempting COQL path...');
  console.log('      SQL:');
  console.log(COQL_SQL.split('\n').map(l => '        ' + l).join('\n'));
  try {
    const records = await coqlPaginate(authCtx, COQL_SQL, 200);
    console.log(`      → COQL returned ${records.length} records`);
    return { method: 'coql', queryFrozen: COQL_SQL, records };
  } catch (err) {
    console.warn(`      → COQL rejected: ${err.message}`);
    return null;
  }
}

async function trySearchChunked(authCtx) {
  console.log('[2/2] Using v8 Search-by-Criteria with Created_Time chunking');
  console.log('      (Search API caps at 2000/session; we have 2818, so we run');
  console.log('       multiple non-overlapping date windows and union the results.)');
  console.log(`      criteria base: ${SEARCH_CRITERIA}`);
  console.log(`      fields:        ${SEARCH_FIELDS}`);

  // All 2,818 tagged Contacts have Created_Time <= 2025-10-16. From the partial
  // Analytics result we saw early records dated 2025-08-20. Three non-overlapping
  // chunks should comfortably keep each session under the 2000-record cap.
  // 8 non-overlapping buckets. Most of the 2,818 cluster in 6-28 Aug 2025
  // (the cohort filter window), so the Aug buckets are tighter.
  const chunks = [
    { label: 'pre-2025-08-06',            clause: '(Created_Time:less_than:2025-08-06T00:00:00+01:00)' },
    { label: '2025-08-06 to 2025-08-13',  clause: '(Created_Time:between:2025-08-06T00:00:00+01:00,2025-08-13T00:00:00+01:00)' },
    { label: '2025-08-13 to 2025-08-20',  clause: '(Created_Time:between:2025-08-13T00:00:00+01:00,2025-08-20T00:00:00+01:00)' },
    { label: '2025-08-20 to 2025-08-25',  clause: '(Created_Time:between:2025-08-20T00:00:00+01:00,2025-08-25T00:00:00+01:00)' },
    { label: '2025-08-25 to 2025-08-29',  clause: '(Created_Time:between:2025-08-25T00:00:00+01:00,2025-08-29T00:00:00+01:00)' },
    { label: '2025-08-29 to 2025-09-15',  clause: '(Created_Time:between:2025-08-29T00:00:00+01:00,2025-09-15T00:00:00+01:00)' },
    { label: '2025-09-15 to 2025-10-01',  clause: '(Created_Time:between:2025-09-15T00:00:00+01:00,2025-10-01T00:00:00+01:00)' },
    { label: '2025-10-01 to 2025-10-17',  clause: '(Created_Time:between:2025-10-01T00:00:00+01:00,2025-10-17T00:00:00+01:00)' },
  ];

  const seen = new Set();
  const all = [];
  for (const c of chunks) {
    const criteria = `${SEARCH_CRITERIA} and ${c.clause}`;
    console.log(`      [chunk ${c.label}] criteria: ${criteria}`);
    const batch = await searchByCriteria(authCtx, 'Contacts', criteria, SEARCH_FIELDS, 200);
    let added = 0;
    for (const rec of batch) {
      if (seen.has(rec.id)) continue;
      seen.add(rec.id);
      all.push(rec);
      added++;
    }
    console.log(`      [chunk ${c.label}] returned ${batch.length} (added ${added} new, distinct total now ${all.length})`);
  }

  const frozen = `Endpoint: GET /crm/v8/Contacts/search\n` +
                 `Base criteria: ${SEARCH_CRITERIA}\n` +
                 `Fields: ${SEARCH_FIELDS}\n` +
                 `\n` +
                 `Search API caps at 2000 records per session. We have 2818 tagged\n` +
                 `Contacts, so the export runs three non-overlapping Created_Time\n` +
                 `chunks, each appended to the base criteria, and unions the results\n` +
                 `(deduplicated by id):\n\n` +
                 chunks.map(c => `  - ${c.label}: ${SEARCH_CRITERIA} and ${c.clause}`).join('\n') +
                 `\n`;
  return { method: 'search-chunked-by-created-time', queryFrozen: frozen, records: all };
}

(async () => {
  console.log('FC-FCA-01 master recipient export');
  console.log('==================================');
  console.log(`Target tag: "${TAG}"`);
  console.log(`Output:     ${path.relative(process.cwd(), CSV_PATH)}`);
  console.log('');

  const authCtx = await getAccessToken();
  console.log(`Authenticated. API base: ${authCtx.apiBase}`);
  console.log('');

  let result = await tryCoql(authCtx);
  if (!result || result.records.length === 0) {
    if (result && result.records.length === 0) {
      console.warn('      → COQL returned 0 records (likely tag filter not honoured); falling back.');
    }
    result = await trySearchChunked(authCtx);
  }

  if (!result.records.length) {
    console.error('No records returned by either path. Aborting before writing empty CSV.');
    process.exit(1);
  }

  // Shape + dedupe by Record_ID
  const seen = new Set();
  const rows = [];
  for (const rec of result.records) {
    if (seen.has(rec.id)) continue;
    seen.add(rec.id);
    rows.push(shapeRow(rec));
  }
  console.log('');
  console.log(`Method used: ${result.method}`);
  console.log(`Distinct records: ${rows.length}`);

  // Write CSV
  const csvAbs = writeCsv(CSV_PATH, rows, CSV_COLUMNS);
  console.log(`Wrote CSV:    ${csvAbs}`);

  // SHA-256 sidecar
  const { hex, sidecar } = writeSha256Sidecar(csvAbs);
  console.log(`SHA-256:      ${hex}`);
  console.log(`Sidecar:      ${sidecar}`);

  // Freeze the query as evidence
  fs.mkdirSync(path.dirname(QUERY_FROZEN_PATH), { recursive: true });
  const queryDoc = `# FC-FCA-01 master recipient query — frozen ${new Date().toISOString()}
#
# Method used at runtime: ${result.method}
# Output CSV row count:   ${rows.length}
# Output CSV SHA-256:     ${hex}
#
# This query was executed against Zoho CRM v8 (EU DC) by
# scripts/02_export_tagged_contacts.js using a Self-Client OAuth token.
# Reproduction: paste this query into a fresh Self-Client (scope
# ZohoCRM.modules.contacts.READ + ZohoCRM.coql.READ) and re-run.
#
# Note on the COQL vs criteria-Search choice:
#   CRM v8 COQL does not officially support Tag.name as a queryable column.
#   The script tries COQL first; if it returns 0 records or errors, it
#   falls back to the v8 criteria-Search endpoint with the same filter
#   expressed as Zoho CRM criteria syntax, which is what produced the
#   authoritative count of 2,818 in the FC-FCA-01 evidence pack.

${result.queryFrozen}`;
  fs.writeFileSync(QUERY_FROZEN_PATH, queryDoc, 'utf8');
  console.log(`Wrote frozen query: ${QUERY_FROZEN_PATH}`);

  console.log('');
  console.log('Done.');
})().catch((err) => {
  console.error('Export failed:', err.stack || err.message);
  process.exit(1);
});
