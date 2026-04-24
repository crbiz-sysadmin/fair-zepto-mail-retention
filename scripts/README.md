# Scripts — FC-FCA-01

This folder will hold the reproducible scripts for bulk export and Books cross-check. As of 25 Apr 2026 they are blocked on access prerequisites; the intended shape is documented here so a developer (or the FCA's own auditor) can construct them once access is wired.

## Why scripts and not interactive MCP only

The FCA evidence pack must be **reproducible from a clean environment**. Interactive MCP queries proved the recipient list (see `../evidence/2026-04-25_fca-promo-oct2025/`) but a regulator may want to re-execute the reconstruction independently. Scripts make that possible.

## Planned scripts

### `02_export_tagged_contacts.js` — bulk export of the 2,818 master recipients

**Purpose:** Pull all CRM Contacts currently tagged `FCA Update Promo` to `evidence/2026-04-25_fca-promo-oct2025/master_recipients_2025-10-16.csv` with columns: `Contact_ID`, `Email`, `Full_Name`, `Created_Time`, `Client_Reference_Number`. Plus a SHA-256 sidecar.

**Two viable paths — pick whichever is unblocked first:**

**Path A — Custom View + ZohoCRM MCP `getRecords`** (no new credentials needed if MCP already authorised for the org):
1. Sean creates a Custom View in CRM UI:
   - Module: Contacts
   - Filter: `Tag` contains `FCA Update Promo`
   - Columns: `id`, `Email`, `Full_Name`, `Created_Time`, `Client_Reference_Number`
   - Name: `FCA_Promo_Oct2025_Recipients`
2. Sean returns the `cvid` (numeric ID visible in the view's URL).
3. Script paginates `getRecords` with `cvid=<id>`, `per_page=200`, `sort_by=id`, walking via `page_token` until `more_records: false`.
4. Writes CSV + SHA-256.

**Path B — Direct REST + COQL with OAuth refresh token** (more reproducible for FCA, but needs credentials):
1. Sean issues an OAuth refresh token with scope `ZohoCRM.modules.contacts.READ`.
2. Script exchanges refresh token for access token, then POSTs to `https://www.zohoapis.eu/crm/v8/coql`:
   ```sql
   SELECT id, Email, Full_Name, Created_Time, Client_Reference_Number
   FROM Contacts
   WHERE Tag.name = 'FCA Update Promo'
   ORDER BY id ASC
   LIMIT 200 OFFSET 0
   ```
   …paginated until exhaustion.
3. Writes CSV + SHA-256. Saves the SQL itself to `sql/contacts_export.sql` as a frozen reproducible artefact.

Path B is preferred for the FCA pack because the SQL can be put in front of a regulator literally. Path A is faster.

### `07_books_crosscheck.js` — match recipients to post-16 Oct cancellation invoices

**Purpose:** Take `master_recipients_2025-10-16.csv` and produce `evidence/.../remediation_candidates.csv` listing recipients with cancellation invoices issued ≥ 16 Oct 2025.

**Prerequisites:** Zoho Books REST API access (read scope on Invoices and Customers). The current Books MCP tools loaded in Claude (`get_invoice`, `get_contact`) are insufficient for bulk querying; needs OAuth refresh token + Books org ID.

**Logic:**
1. For each recipient row, look up the Books Customer by email (and fall back to `zcrm_account_id` if email mismatch).
2. Query Invoices where `customer_id = X` AND `date >= 2025-10-16` AND `status` indicates cancellation (or invoice line items reference cancellation; exact filter needs to be confirmed against the Books invoice schema).
3. Output: `Contact_ID, Email, Books_Customer_ID, Invoice_Number, Invoice_Date, Amount, Status`.

### `08_tag_FCA_Promo_Oct2025_field.js` — bulk-set custom field after Sean+Ony sign-off

**Purpose:** After the master list is signed off, set the custom Boolean field `FCA_Promo_Oct2025` (or equivalent) on every recipient Contact for permanent CRM-visible audit. (Per FC-FCA-01 acceptance criteria. Note: arguably redundant given the existing tag, but kept in case Sean+Ony want a separate marker that can't be confused with operational tag use.)

**Hard gate:** must not run before Sean+Ony sign off the master list.

## Status

| Script | Status | Blocked on |
|---|---|---|
| `02_export_tagged_contacts.js` | Not started | CRM Custom View `cvid` from Sean OR OAuth refresh token |
| `07_books_crosscheck.js` | Not started | Zoho Books OAuth refresh token + org ID + invoice schema confirmation |
| `08_tag_FCA_Promo_Oct2025_field.js` | Not started | Sean + Ony sign-off on master list; confirmation that the custom field exists on Contact |
