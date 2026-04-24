# CR: ZeptoMail Retention, FCA Recipient Recovery & Mass-Mailout Governance

**Brand:** Fair Claims
**Raised by:** Sean Sullivan
**Date raised:** 22 April 2026
**Approved:** 24 April 2026
**Trigger:** Impromptu meeting 22 Apr 2026 with Tony & Perry re FCA enquiry and ZeptoMail 60-day log purge
**Regulatory context:** Live FCA matter. Meeting with FCA early week commencing 27 April 2026.

---

## Problem Statement

Three linked issues surfaced during the 22 Apr 2026 call:

1. ZeptoMail retains processed email logs for only 60 days. This breaches FCA record-keeping and UK GDPR six-year retention obligations for regulated transactional communications.
2. A mass email sent 16 Oct 2025 ("Important Update Regarding Promotions") offered ~2,500 single-claim clients free cancellation in line with an FCA-agreed remediation. The recipient list was never saved. ZeptoMail logs are purged. Any recipient subsequently invoiced a cancellation fee is a live FCA complaint risk.
3. No durable audit artefact is produced at the point of any mass mailout. Workflow history only retains 90 days. Tags are unreliable as audit evidence. The same class of failure will recur on every future batch unless a governance control is implemented.

> **Note (Direction doc §1):** the meeting transcript clarifies that the free-cancellation email was actually sent **6–28 Aug 2025**. The 16 Oct 2025 email was a cases-on-hold notice for an advertising issue. This CR's problem statement and FC-FCA-01 acceptance criteria conflate the two. Scope must be confirmed by Ony/Sean before FC-FCA-01 starts — see the direction doc for detail.

## Objectives

1. Achieve six-year retention of all ZeptoMail transactional email logs (provider-side or via automated export to our own storage).
2. Reconstruct the 16 Oct 2025 recipient list with evidenced methodology, cross-check against issued cancellation invoices, and close affected claims before the FCA meeting.
3. Implement a permanent governance control so every future mass mailout produces a durable, immutable recipient artefact at send time.

## Out of Scope

- Migration away from ZeptoMail (only considered if Zoho confirms no remediation path).
- Reconstruction of mass mailouts prior to 16 Oct 2025 (may become in-scope depending on FCA scope).
- Rework of individual transactional emails (single-recipient, not mass).

---

## Sprint Cards

### Category 1 — ZeptoMail Retention & Compliance

**FC-ZM-01 — Track Zoho Support ticket response on ZeptoMail retention**
- Response received from Zoho on all four questions raised in the 22 Apr support email
- Response logged to compliance file
- Go/no-go decision recorded: remediate on ZeptoMail vs migrate

**FC-ZM-02 — Build automated daily ZeptoMail log export pipeline**
- Log export runs daily and captures the prior day's processed emails before the 60-day purge window
- Exports stored with 6-year retention in WorkDrive or Catalyst DataStore (target TBC in design)
- Each export is immutable once written (append-only or hash-verified)
- Failure alerts route to internal support department
- Runbook documents recovery path if a daily run is missed

**FC-ZM-03 — Attach per-client email record to CRM Contact timeline**
- For every ZeptoMail send, the recipient's CRM Contact record carries a permanent record of send: template, subject, timestamp, delivery status
- Record survives beyond 60 days independent of ZeptoMail
- Queryable via standard CRM search and exportable in a subject access request

**FC-ZM-04 — Compliance memo: ZeptoMail suitability decision**
- One-page memo summarising Zoho's response, the remediation implemented, and residual risk
- Signed off by Ony as accountable person
- Filed against the FCA matter for production if requested

### Category 2 — FCA 16 Oct 2025 Recipient Recovery

**FC-FCA-01 — Reconstruct, cross-check and remediate the 16 Oct 2025 recipient list**
- Recipient list reconstructed by scripted search of CRM Contact/Deal timeline for the field update to `Mass Email Clients = "Important Update Regarding Promotions"` (or equivalent picklist value) dated 16 Oct 2025
- Reconstruction method documented and reproducible; evidence pack suitable for FCA production
- List cross-referenced against:
  - Original filter criteria (lead creation date range + excluded lead sources) — criteria sourced from Cliq/email/Laura and locked as source of truth
  - Desk thread search on subject "Important Update Regarding Promotions" as secondary verification
- Every recipient on the reconstructed list tagged in CRM with a permanent custom field marker `FCA_Promo_Oct2025 = TRUE` (not a tag)
- Cross-check run against Books/CRM cancellation invoices issued to any flagged client after 16 Oct 2025
- For every match: claim closed, cancellation invoice reversed/credited, client contacted per Ony's direction
- Remediation log produced showing every action taken per client, ready for FCA disclosure

### Category 3 — Mass-Mailout Governance

**FC-GOV-01 — Mandatory recipient snapshot at send time**
- Every mass mailout (any send >50 recipients via ZeptoMail or CRM Mass Email) produces a CSV snapshot of the recipient list at the moment of send
- Snapshot includes: Contact/Deal ID, email address, send timestamp, template name, mailout reference ID
- Snapshot stored in WorkDrive under a dated mailout folder structure; retention 6 years minimum
- No mass send can be executed without the snapshot being produced (enforced by workflow or pre-send check)

**FC-GOV-02 — Replace tag-based mailout flagging with custom field**
- New custom field on Contact (and Deal where applicable) — `Mass_Mailout_History` as a subform or multi-line structured field
- Records: mailout reference ID, date, template, delivery status per recipient
- Tags may still be used for operational filtering but are no longer the audit source of truth
- Existing mass-mailout tags remain in place; no retrospective migration in this CR

**FC-GOV-03 — Workflow execution history export**
- Workflow execution history for mass-mailout workflows exported on the same 6-year retention schedule as ZeptoMail logs
- Stored alongside mailout snapshots in WorkDrive
- Runbook documents how to reconcile workflow history against recipient snapshots

**FC-GOV-04 — Mass mailout SOP document**
- Written SOP covering: filter definition sign-off, snapshot production, template sign-off, send authorisation, post-send verification, evidence filing
- Signed off by Ony and filed in WorkDrive
- Referenced in induction for anyone authorised to execute mass mailouts

---

## Dependencies

- FC-ZM-02 and FC-ZM-03 design cannot be finalised until FC-ZM-01 returns Zoho's response
- FC-GOV-01 depends on FC-ZM-02 architecture decision (same storage target preferred)
- FC-FCA-01 is independent and runs in parallel — highest priority given FCA meeting timeline

## Priority

1. FC-FCA-01 — FCA meeting deadline, top priority
2. FC-ZM-01 — gates downstream design
3. FC-GOV-01 — prevents recurrence, can start scoping in parallel
4. All others sequenced after the first three land

## Notes for Sprint Logging

Cards are intentionally lean (title + AC only). Technical approach, estimates, and subtask breakdown to be added inside each Sprints work item as it enters the active sprint. Time logged against the Sprints item ID is the billing source of truth.
