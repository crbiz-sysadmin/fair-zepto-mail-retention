'use strict';

/**
 * OAuth refresh-token → access-token exchange for Zoho CRM.
 * Reads ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_DC from env.
 * Returns { accessToken, expiresAt }.
 */

const https = require('https');

function loadDotEnv(envPath) {
  const fs = require('fs');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    if (line.trim().startsWith('#')) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = val;
  }
}

function postForm(urlString, formObj) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = new URLSearchParams(formObj).toString();
    const req = https.request({
      method: 'POST',
      hostname: url.hostname,
      path: url.pathname + (url.search || ''),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(text) });
        } catch {
          resolve({ statusCode: res.statusCode, body: { _raw: text } });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const path = require('path');
  loadDotEnv(path.join(__dirname, '..', '.env'));

  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;
  const dc = process.env.ZOHO_DC || 'eu';

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing required env vars: ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN');
  }

  const accountsBase = `https://accounts.zoho.${dc}`;
  const url = `${accountsBase}/oauth/v2/token`;
  const { statusCode, body } = await postForm(url, {
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  });

  if (statusCode !== 200 || !body.access_token) {
    throw new Error(`Token exchange failed (status ${statusCode}): ${JSON.stringify(body)}`);
  }

  return {
    accessToken: body.access_token,
    expiresAt: Date.now() + ((body.expires_in || 3600) * 1000),
    apiBase: `https://www.zohoapis.${dc}/crm/v8`,
    dc,
  };
}

module.exports = { getAccessToken };
