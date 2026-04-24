'use strict';

/**
 * Thin Zoho CRM v8 REST helpers.
 * Two query paths supported:
 *   1. coqlSelect(token, sql)            — POST /crm/v8/coql with select_query body
 *   2. searchByCriteria(token, mod, criteria, fields, perPage)
 *                                         — paginated GET /crm/v8/{module}/search
 *
 * Retry on 429 with exponential backoff.
 */

const https = require('https');

function request(method, urlString, headers, bodyObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = bodyObj ? JSON.stringify(bodyObj) : null;
    const opts = {
      method,
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers: { ...headers },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let parsed = text;
        try { parsed = JSON.parse(text); } catch { /* keep as text */ }
        resolve({ statusCode: res.statusCode, body: parsed, text });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function withRetry(fn, { tries = 4, baseMs = 1000 } = {}) {
  for (let attempt = 0; attempt <= tries; attempt++) {
    const res = await fn();
    if (res.statusCode === 429 && attempt < tries) {
      const wait = baseMs * Math.pow(2, attempt);
      console.warn(`[CRM] 429 rate-limit, waiting ${wait}ms (attempt ${attempt + 1}/${tries})`);
      await sleep(wait);
      continue;
    }
    if (res.statusCode === 500 && attempt < 2) {
      const wait = baseMs * Math.pow(2, attempt);
      console.warn(`[CRM] 500 server error, waiting ${wait}ms (attempt ${attempt + 1}/2)`);
      await sleep(wait);
      continue;
    }
    return res;
  }
}

/**
 * COQL SELECT against CRM v8.
 * Returns { data: [...records...] } on success or null on empty.
 * COQL accepts MAX 200 LIMIT and supports OFFSET for paging.
 */
async function coqlSelect(authCtx, sql) {
  const url = `${authCtx.apiBase}/coql`;
  const headers = { Authorization: `Zoho-oauthtoken ${authCtx.accessToken}` };
  const res = await withRetry(() => request('POST', url, headers, { select_query: sql }));
  if (res.statusCode === 204) return { data: [] };
  if (res.statusCode !== 200) {
    throw new Error(`COQL request failed (status ${res.statusCode}): ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
  }
  return res.body;
}

/**
 * Paginate a COQL SELECT statement. The SQL must include a placeholder LIMIT/OFFSET,
 * which this function manages.
 *
 *   const sqlBody = `SELECT id, Email, First_Name, Last_Name, Created_Time
 *                    FROM Contacts
 *                    WHERE Tag.name = 'FCA Update Promo'
 *                    ORDER BY id ASC`;
 *   const all = await coqlPaginate(ctx, sqlBody);
 */
async function coqlPaginate(authCtx, sqlBody, perPage = 200, hardCap = 100000) {
  const all = [];
  let offset = 0;
  while (offset < hardCap) {
    const sql = `${sqlBody} LIMIT ${perPage} OFFSET ${offset}`;
    const res = await coqlSelect(authCtx, sql);
    const batch = res?.data || [];
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    offset += perPage;
  }
  return all;
}

/**
 * Paginate v8 Search-by-Criteria. Use as a fallback when COQL can't express the filter
 * (e.g., tag-based filtering is not first-class in COQL).
 *
 * Note: the v8 Search endpoint caps at 2000 records per criteria. Callers that
 * may exceed 2000 should chunk the criteria themselves (e.g., by Created_Time
 * windows) and call this function once per chunk.
 */
async function searchByCriteria(authCtx, moduleName, criteria, fields, perPage = 200) {
  const all = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      criteria,
      fields,
      per_page: String(perPage),
      page: String(page),
    });
    const url = `${authCtx.apiBase}/${encodeURIComponent(moduleName)}/search?${params.toString()}`;
    const headers = { Authorization: `Zoho-oauthtoken ${authCtx.accessToken}` };
    const res = await withRetry(() => request('GET', url, headers));
    if (res.statusCode === 204) break;
    if (res.statusCode === 400 && res.body?.code === 'LIMIT_REACHED') {
      throw new Error(`Search hit 2000-record cap on this criteria; chunk further. criteria=${criteria}`);
    }
    if (res.statusCode !== 200) {
      throw new Error(`Search request failed (status ${res.statusCode}): ${typeof res.body === 'string' ? res.body : JSON.stringify(res.body)}`);
    }
    const batch = res.body?.data || [];
    if (batch.length === 0) break;
    all.push(...batch);
    if (!res.body?.info?.more_records) break;
    page++;
  }
  return all;
}

/**
 * Bulk Read async job. Designed for >2000-record exports — works around the
 * Search API's 2000-record cap. Returns the parsed CSV rows.
 *
 * Steps:
 *   1. POST /crm/bulk/v8/read with { query: { module, criteria, fields } }
 *   2. Poll GET /crm/bulk/v8/read/<jobId> until state == "COMPLETED"
 *   3. GET /crm/bulk/v8/read/<jobId>/result — returns a zip; we follow the
 *      Result-Location redirect to download a CSV-in-zip.
 *
 * For simplicity we depend on the Node `zlib` stdlib; the bulk-read endpoint
 * actually returns a zip containing one CSV. We use a minimal zip extractor.
 */
async function bulkReadCsv(authCtx, moduleName, criteria, fields, pollIntervalMs = 5000, maxWaitMs = 600000) {
  const bulkBase = authCtx.apiBase.replace('/crm/v8', '/crm/bulk/v8');
  const headers = { Authorization: `Zoho-oauthtoken ${authCtx.accessToken}` };

  // 1. Submit
  const submitUrl = `${bulkBase}/read`;
  const submitBody = {
    query: {
      module: { api_name: moduleName },
      criteria,
      fields: fields.split(',').map(s => s.trim()),
    },
  };
  const submitRes = await withRetry(() => request('POST', submitUrl, headers, submitBody));
  if (submitRes.statusCode !== 201) {
    throw new Error(`Bulk Read submit failed (status ${submitRes.statusCode}): ${typeof submitRes.body === 'string' ? submitRes.body : JSON.stringify(submitRes.body)}`);
  }
  const jobInfo = submitRes.body?.data?.[0]?.details;
  if (!jobInfo?.id) {
    throw new Error(`Bulk Read submit returned no job id: ${JSON.stringify(submitRes.body)}`);
  }
  const jobId = jobInfo.id;
  console.log(`      Bulk Read job submitted: ${jobId}`);

  // 2. Poll
  const pollUrl = `${bulkBase}/read/${jobId}`;
  const startedAt = Date.now();
  let status = null;
  while (Date.now() - startedAt < maxWaitMs) {
    await sleep(pollIntervalMs);
    const pollRes = await request('GET', pollUrl, headers);
    if (pollRes.statusCode !== 200) {
      throw new Error(`Bulk Read poll failed (status ${pollRes.statusCode}): ${typeof pollRes.body === 'string' ? pollRes.body : JSON.stringify(pollRes.body)}`);
    }
    status = pollRes.body?.data?.[0];
    console.log(`      Job ${jobId} state: ${status?.state} (operation: ${status?.operation || '?'}, count so far: ${status?.result?.count ?? '?'})`);
    if (status?.state === 'COMPLETED') break;
    if (status?.state === 'FAILURE') {
      throw new Error(`Bulk Read job FAILED: ${JSON.stringify(status)}`);
    }
  }
  if (status?.state !== 'COMPLETED') {
    throw new Error(`Bulk Read job did not complete within ${maxWaitMs}ms — last state: ${status?.state}`);
  }

  // 3. Download zip
  const dlUrl = `${bulkBase}/read/${jobId}/result`;
  const zipBuf = await new Promise((resolve, reject) => {
    const url = new URL(dlUrl);
    https.get({
      method: 'GET',
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers,
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Bulk Read download failed (status ${res.statusCode})`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });

  // 4. Extract single CSV from zip
  const csvText = extractFirstCsvFromZip(zipBuf);
  return csvText;
}

/**
 * Minimal zip extractor for our specific case (one CSV inside a single-file zip).
 * Implements only STORE (no compression) and DEFLATE (RFC 1951 via zlib).
 */
function extractFirstCsvFromZip(buf) {
  const zlib = require('zlib');
  // Find Local File Header signature 0x04034b50
  for (let i = 0; i < buf.length - 30; i++) {
    if (buf.readUInt32LE(i) === 0x04034b50) {
      const compressionMethod = buf.readUInt16LE(i + 8);
      const compressedSize = buf.readUInt32LE(i + 18);
      const uncompressedSize = buf.readUInt32LE(i + 22);
      const fileNameLen = buf.readUInt16LE(i + 26);
      const extraLen = buf.readUInt16LE(i + 28);
      const dataStart = i + 30 + fileNameLen + extraLen;
      const compressed = buf.slice(dataStart, dataStart + compressedSize);
      if (compressionMethod === 0) {
        return compressed.toString('utf8');
      } else if (compressionMethod === 8) {
        return zlib.inflateRawSync(compressed).toString('utf8');
      } else {
        throw new Error(`Unsupported zip compression method: ${compressionMethod}`);
      }
    }
  }
  throw new Error('No Local File Header found in zip response');
}

module.exports = { coqlSelect, coqlPaginate, searchByCriteria, bulkReadCsv };
