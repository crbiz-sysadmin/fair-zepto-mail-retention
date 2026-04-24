# CR Stub — FC-FCA-02: Audit prior ZeptoMail campaigns for reconstructability

**Brand:** Fair Claims
**Raised by:** Sean Sullivan
**Date raised:** 25 April 2026
**Status:** Stub — pending Ony approval (proposed in [25 Apr email to Ony](../2026-04-25_email-to-Ony-FCA-FCA-01-status.md))
**Relationship to existing CR:** New sprint card under the same parent CR ("ZeptoMail Retention, FCA Recipient Recovery & Mass-Mailout Governance"). Sits in Category 2 (FCA Recipient Recovery) alongside FC-FCA-01.

## Problem

FC-FCA-01 reconstructed the 16 Oct 2025 recipient list via the `FCA Update Promo` tag that the workflow rule applies at send time. **That tag-add action exists only on sequence 2 of workflow rule 794088000139471721.** The other 8 conditions in the same workflow rule (covering 8 separate prior ZeptoMail campaigns) have no `add_tags` action.

If the FCA broadens scope beyond the Oct 16 mailout — and they reasonably might — we currently have no answer for: "who received the Claims Overview / Progress Update mailout?" or "the Diesel Emissions one?" etc. The same gap that bit us on Oct 16 (no logs, no field history, no workflow view past 90 days) applies to every prior campaign too. The only difference is that Oct 16 happened to have a tag.

We need to look — systematically — for any persistent artefact on each prior campaign before more time passes and any remaining traces age out.

## Objectives

1. For each of the 8 prior campaigns dispatched via workflow rule 794088000139471721 (sequences 1, 3–9):
   - Identify any persistent CRM-side artefact (tag, custom field state, related Note, Activity, anything) that allows recipients to be enumerated.
   - Reconstruct the recipient list where possible.
   - Document the unrecoverable state where not, with a methodology pack equivalent to the FC-FCA-01 evidence pack.
2. Produce a consolidated "What We Can / Cannot Reconstruct" matrix to put in front of the FCA proactively rather than reactively.

## Scope

**In scope:** Sequences 1, 3, 4, 5, 6, 7, 8, 9 of workflow rule 794088000139471721 (ID and content captured in [evidence/2026-04-25_fca-promo-oct2025/source_queries/01_workflow_rule_794088000139471721.json](../../evidence/2026-04-25_fca-promo-oct2025/source_queries/01_workflow_rule_794088000139471721.json)). Each represents a separate ZeptoMail campaign:

| Seq | Campaign value | Function |
|---|---|---|
| 1 | Claims Overview / Progress Update | `Mass Email Claim Overview Via ZeptoMail` |
| 3 | Redress Scheme Update With Claim Overview (actual: FCA Update Regarding The Redress Scheme) | `Redress Scheme Update With Claim Overview` |
| 4 | Fair Motor Complaints - Happy New Year | `Fair Happy New Year` |
| 5 | Diesel Emissions Scandal & Overview | `Diesel Emissions - Overview Zepto Mail` |
| 6 | March 2026 Customer Update | `March 2025 Customer Update` |
| 7 | March 2026 Customer Update New | `March 2026 New Update Email` |
| 8 | March 2026 Customer Update New 3 | `March Update 3` |
| 9 | April 2026 Customer Portal | `April 2026 Client Portal` |

**Out of scope:** Mass mailouts sent via mechanisms other than this workflow rule. (Separate audit if FCA scope demands.)

## Approach (high level — to be detailed once approved)

For each campaign:

1. Inspect the function's Deluge code (analogue of the FC-FCA-01 capture) for any tag/field side-effects that we can use as anchors.
2. Check if any tags exist in CRM whose name plausibly maps to the campaign (e.g. a "Diesel Emissions" tag).
3. Check `Last_Auto_Email_Sent` field state — this gets updated by the workflow's field-update action, but only stores the *most recent* send so it's not campaign-specific in isolation. Combined with subsequent campaign timing it may bracket cohorts.
4. Check Zoho Desk for reply tickets (subject search per campaign template title, time window per send date) — confirmatory only, partial coverage.
5. Where reconstructable, follow the FC-FCA-01 methodology to produce an evidence pack per campaign.
6. Where not reconstructable, document the methodology of the search and the negative result for the FCA.

## Acceptance criteria

- One evidence pack per prior campaign in `evidence/<date>_<campaign-slug>/` with the same structure as `evidence/2026-04-25_fca-promo-oct2025/`.
- Consolidated "Reconstructability Matrix" at `evidence/_reconstructability-matrix.md` summarising what we can/cannot retrieve per campaign.
- Where reconstructed: master recipient list CSV + Books cross-check for any post-send invoicing anomalies (same shape as FC-FCA-01 deliverable).
- Where not reconstructed: documented search methodology + negative result + risk assessment.
- Sean + Ony sign-off on the matrix before any FCA disclosure.

## Dependencies + sequencing

- **Cannot start until FC-FCA-01 is closed** — we need the bandwidth and the precedent methodology to be locked first.
- Independent of FC-ZM-* (retention) work but obviously informs it: if multiple campaigns turn out unrecoverable, that's added urgency on FC-ZM-02 (daily export pipeline) and FC-ZM-03 (per-client CRM record).

## Priority

**P1.** Below FC-FCA-01 (P0, FCA-meeting-blocking). Above the FC-GOV preventative work because the regulatory exposure is concrete.
