# FCA Evidence Pack — 16 Oct 2025 "Important Update Regarding Promotions" mailout

**Pack date:** 25 Apr 2026
**Workstream:** FC-FCA-01 (recipient reconstruction + remediation)
**FCA meeting:** week commencing 27 Apr 2026
**Author:** Sean Sullivan
**Reviewer / sign-off:** Ony (pending)

## Bottom line

**The complete recipient list of the 16 Oct 2025 mass email is reconstructable with high confidence as the set of 2,818 Contacts in Zoho CRM currently bearing the tag `FCA Update Promo`.**

This is not an inference from filter rules. The tag was applied **at send time** by sequence 2 of CRM workflow rule 794088000139471721 ("Mass Email Via Zepto Mail"), which is the same condition that fires the ZeptoMail send. The tag therefore captures the *actual* cohort the workflow processed, not what we infer from any retrospective filter reconstruction. With `over_write: false` on the tag-add action and no automated tag-removal anywhere in the workflow chain, the tag is durable across all 8 subsequent campaigns sent by the same workflow.

## Why the obvious sources failed

The original FC-FCA-01 plan (see [direction doc §3](../../docs/FCA-ZeptoMail-CR-Direction.md)) anticipated a 4-source triangulation. Only one survived. Each failure is documented below so the FCA reader can see we systematically ruled out the alternatives:

| Source | Outcome | Why |
|---|---|---|
| ZeptoMail logs | Dead | 60-day purge — Oct 16 logs deleted in Dec 2025. |
| CRM picklist field current state (`Mass_Email_Clients = "Important Update Regarding Promotions"`) | Dead — 0 records | The Deluge function `Mass_Email_Promotion_Update_Via_ZeptoMail` overwrites the field to `"Email Sent"` (or `"Email Failed"`) immediately after send. Every recipient's field has since been further overwritten by one of the 7 subsequent campaigns. |
| CRM field-change audit log | Dead | `history_tracking_enabled = false` on `Mass_Email_Clients`. No audit trail of historical values. |
| CRM workflow execution view | Dead | ~90-day retention; Oct 16 is 6 months ago. |
| Zoho Desk reply-ticket search | **Partial** — 6 confirmed recipients within reasonable reply window | Reply rate ~0.21% gives a small but useful confirmatory anchor set. |
| **CRM tag `FCA Update Promo`** | **Live — 2,818 Contacts** | **The reconstruction.** Tag was applied at send time and persists. |

## Frozen evidence files

All raw artefacts are checked into [`source_queries/`](source_queries/). Every claim in this README and in the recipient list traces back to one of these files.

| File | Content |
|---|---|
| [`01_workflow_rule_794088000139471721.json`](source_queries/01_workflow_rule_794088000139471721.json) | The workflow rule that triggered the campaign and applied the tag. Captured 25 Apr 2026 from `GET /crm/v8/settings/automation/workflow_rules/794088000139471721`. |
| [`02_deluge_function_Mass_Email_Promotion_Update_Via_ZeptoMail.dg`](source_queries/02_deluge_function_Mass_Email_Promotion_Update_Via_ZeptoMail.dg) | Source code of the custom function that performs the actual ZeptoMail send. Provided by Sean. ZeptoMail authorization key redacted in this committed copy. |
| [`03_picklist_values_Mass_Email_Clients.json`](source_queries/03_picklist_values_Mass_Email_Clients.json) | Frozen list of all picklist values configured for the trigger field, plus runtime values observed in data. |
| [`04_record_counts_2026-04-25.json`](source_queries/04_record_counts_2026-04-25.json) | Frozen counts: master 2,818 tag, sanity check, cohort intersection, dead picklist query. |
| [`05_desk_reply_tickets.json`](source_queries/05_desk_reply_tickets.json) | The 6 Zoho Desk reply tickets confirming the campaign and providing independent anchor recipients. |

## Reproducibility

Any reader with API access to this CRM org can re-run the master count by issuing:

```
GET https://www.zohoapis.eu/crm/v8/Contacts/actions/count
    ?criteria=(Tag.name:equals:FCA Update Promo)
```

Expected result: a count near 2,818 (will diverge over time only if a tag is manually removed from a Contact).

A reproducible bulk-export script that pulls the actual Contact IDs/emails to CSV is being built — see `../../scripts/02_export_tagged_contacts.js` (in progress).

## Confidence model

**HIGH confidence** that the master list of 2,818 recipients is materially complete and accurate, subject to:

1. **Single risk:** if the tag was manually removed from any recipient between send time and now, that recipient is missing from this list. There is no automated tag-removal anywhere in the workflow chain. Manual removal is possible but unlikely without explicit reason.
2. **Tag-count slight overshoot vs transcript:** transcript estimated "approximately 2,500 clients"; tag count is 2,818. The transcript figure was a verbal estimate. The tag count is the actual.
3. **No false positives expected:** workflow rule sequence 2's tag-add action only fires when `Mass_Email_Clients = "Important Update Regarding Promotions"`. That value is exclusively associated with the Oct 16 campaign — no other campaign uses it. Any Contact with the tag was processed by this exact send.

## Outstanding work for the evidence pack

- [x] Bulk-export the 2,818 Contact IDs + emails to [`master_recipients_2025-10-16.csv`](master_recipients_2025-10-16.csv) with SHA-256 sidecar [`master_recipients_2025-10-16.csv.sha256`](master_recipients_2025-10-16.csv.sha256). Reproducible via [`scripts/02_export_tagged_contacts.js`](../../scripts/02_export_tagged_contacts.js); the exact criteria + chunking strategy is frozen at [`source_queries/06_query_used.txt`](source_queries/06_query_used.txt). Method: chunked v8 Search-by-Criteria across 8 Created_Time windows (the Search API caps at 2,000 records per session and we have 2,818). COQL was attempted first but rejected `Tag.name` as a queryable column; Bulk Read API was unavailable due to OAuth scope.
- [ ] Books cross-check: identify which of the 2,818 received cancellation invoices issued ≥ 16 Oct 2025. Output: `remediation_candidates.csv`.
- [ ] Sean + Ony review of the master list and remediation candidates **before any state change** (CRM tagging, invoice reversal, claim closure).
- [ ] Per-recipient remediation actions and `remediation_log.csv` (driven by Ony's direction).
- [ ] SHA-256 manifest covering all artefacts in this pack.

## Cohort distribution (from master CSV)

The 2,818 recipients break down by Created_Time as follows — useful context for the FCA discussion of "who was in the cohort":

| Created_Time bucket | Count | Notes |
|---|---:|---|
| Before 6 Aug 2025 | 969 | Pre-cohort tagged Contacts — Laura's selection extended beyond the documented 6–28 Aug window |
| 6–13 Aug 2025 | 785 | Within cohort window |
| 13–20 Aug 2025 | 981 | Within cohort window |
| 20–25 Aug 2025 | 82 | Within cohort window |
| 25–29 Aug 2025 | 0 | Within cohort window — none |
| 29 Aug – 15 Sep 2025 | 1 | Edge case |
| 15 Sep – 1 Oct 2025 | 0 | |
| 1 Oct – 16 Oct 2025 | 0 | |
| **Total** | **2,818** | Matches `getRecordCount` master query in [`source_queries/04_record_counts_2026-04-25.json`](source_queries/04_record_counts_2026-04-25.json) |

Implication: of the 2,818, only 1,848 fall in the strict 6–28 Aug 2025 lead-creation window the meeting documented. The remaining 970 (mostly pre-6 Aug) were included by Laura's actual filter but not by the cohort-rule we'd retrospectively assume. **The tag is more authoritative than any retrospective filter reconstruction** — it captures the actual cohort processed by the workflow at send time.

## Methodology — for FCA presentation

1. We attempted to retrieve the recipient list from the email service provider (ZeptoMail). Logs were unavailable due to the provider's 60-day retention policy. (This is the underlying compliance issue motivating the broader CR; see [direction doc](../../docs/FCA-ZeptoMail-CR-Direction.md).)
2. We attempted to retrieve recipients from the current state of the trigger field on Contact records. Zero records carried the campaign value because the post-send Deluge function overwrites the field to `"Email Sent"`. The field had no audit history enabled.
3. We attempted to retrieve recipients from the CRM workflow execution view. The 90-day retention window had already expired by April 2026.
4. We discovered (via the workflow rule definition itself) that the same workflow condition that fires the email send also adds a CRM tag (`FCA Update Promo`) to the recipient. The tag-add action uses `over_write: false`, so the tag accumulates and survives subsequent campaigns. No remove-tag action exists in the rule.
5. We queried CRM for Contacts currently tagged `FCA Update Promo`: 2,818 results.
6. We sanity-checked the cohort against the documented date envelope (Created_Time ≤ 16 Oct 2025): 2,818/2,818 match.
7. We cross-checked one tagged Contact (Paul Aldridge, paulaldridge604@gmail.com) against an independent source — a Zoho Desk reply ticket #87471 created at 11:07 on 16 Oct 2025 with subject "Re: FIAR - Important Update Regarding Promotions". Cross-source agreement confirmed.
8. We documented every query, response, and source artefact in `source_queries/` for independent re-execution.

The 2,818 figure is therefore not a derivation, an estimate, or a reconstruction from filter rules — it is the actual set of records the CRM tagged at the moment of send.
