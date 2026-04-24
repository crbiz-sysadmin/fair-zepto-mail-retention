# FCA / ZeptoMail Retention & Mass-Mailout Governance — Direction

**Brand:** Fair Claims
**CR raised:** 22 Apr 2026 (Sean)
**CR approved:** Yes (this doc)
**Today:** 24 Apr 2026
**FCA meeting:** Early week commencing 27 Apr 2026
**Sprint length target:** 5 working days (aligned to FCA meeting deadline for FC-FCA-01)

Source artefacts (authoritative):
- CR text — this CR (ZeptoMail Retention, FCA Recipient Recovery & Mass-Mailout Governance)
- Meeting recording — 22 Apr 2026 impromptu Google Meet (Sean, Tony, Perry)
  https://fathom.video/share/3EaSspK3nt5Rq7WcJi_od6SsMsWb8Riv
- Transcript summary — included in session notes (paste into this folder if not already archived)

---

## 1. Scope + Reconstruction Source — RESOLVED 25 Apr 2026

Confirmed by Sean 24 Apr 2026: there is **one email**. It was sent on **16 Oct 2025** ("Important Update Regarding Promotions") to a recipient cohort filtered by **lead criteria falling between 6–28 Aug 2025**.

**Reconstruction source — RESOLVED 25 Apr 2026:** the multi-source triangulation plan (S1–S4 below) is superseded. The recipient list is the set of **2,818 Contacts in CRM currently tagged `FCA Update Promo`**. The tag was applied at send time by sequence 2 of CRM workflow rule `794088000139471721` and persists durably (no automated removal anywhere in the workflow chain). Cross-confirmed against an independent Zoho Desk reply ticket (Paul Aldridge, #87471).

Full evidence pack: [`evidence/2026-04-25_fca-promo-oct2025/`](../evidence/2026-04-25_fca-promo-oct2025/README.md) — workflow rule JSON, Deluge function code, picklist values, frozen counts, Desk results, methodology.

Implications:
- S1 (CRM picklist current state) = **dead** (0 records; field is overwritten to `Email Sent` by the Deluge function).
- S2 (CRM field audit log) = **dead** (`history_tracking_enabled = false` on the field).
- S3 (Tony's WorkDrive spreadsheet) = no longer required; the tag is more authoritative than any retrospective filter reconstruction.
- S4 (Desk reply tickets) = retained as confirmatory cross-check.
- Custom field marker `FCA_Promo_Oct2025 = TRUE` is now redundant — the existing tag already serves this purpose.

No splitting of FC-FCA-01 required.

---

## 2. Direction Summary

Three linked workstreams, sequenced by regulatory urgency:

1. **FCA recipient recovery** (Category 2) — evidence-pack production for the FCA meeting. Independent of Zoho response. Highest priority.
2. **ZeptoMail retention remediation** (Category 1) — gated on Zoho Support response to the 22 Apr ticket. Scope design after response received. Target: six-year retention, immutable storage, per-client CRM timeline records.
3. **Mass-mailout governance control** (Category 3) — preventative; scoping can start in parallel with Workstream 1. Final architecture waits on Workstream 2 (shared storage target assumed).

We will not write a full BRD for this CR. Each sprint card below carries enough direction to enter the backlog and be worked; technical approach and estimates are added inside the Zoho Sprints item when it enters an active sprint.

---

## 3. Task Breakdown (for Zoho Sprints intake)

Each task below maps 1:1 to a Zoho Sprints item. Workspace: CoolRunnings Business Solutions (`teamId 7000238134`). Project: Fair Claims (confirm projectId before creation). Prefix suggestion: `FCZM`.

Format per task:
- **ID** — matches CR card
- **Title / Type** — story or task
- **AC** — from CR (verbatim or tightened)
- **Direction notes** — what the implementer needs to know that the CR doesn't say
- **Gating** — what must be true before this can start
- **Priority** — P0 (FCA-meeting-blocking), P1 (retention-compliance), P2 (governance/preventative)

### Category 1 — ZeptoMail Retention & Compliance

#### FC-ZM-01 — Track Zoho Support response (P1, Type: Task)
- AC: Response received on all four questions; logged to compliance file; go/no-go recorded (remediate vs migrate).
- Direction: Ticket already raised 22 Apr by Sean. This card is the follow-through — chase cadence (every 48h), escalation path (Zoho account manager), and the decision memo it feeds into FC-ZM-04.
- Gating: None.
- Priority: P1 (gates FC-ZM-02 and FC-ZM-03 design).

#### FC-ZM-02 — Automated daily ZeptoMail log export pipeline (P1, Type: Story)
- AC: Daily run captures prior day's logs inside the 60-day window; 6-year immutable storage (WorkDrive or Catalyst DataStore — to confirm); failure alerts to internal support dept; runbook for missed-run recovery.
- Direction: Build on Zoho Catalyst (project already exists — `catalyst-project/` in repo). Preferred target: Catalyst DataStore for query + WorkDrive for immutable archive, SHA-256 hash per daily export. Use ZeptoMail REST API for log pull. Runbook lives alongside pipeline code.
- Gating: FC-ZM-01 response received; storage target confirmed with Ony.
- Priority: P1.

#### FC-ZM-03 — Per-client email record on CRM Contact timeline (P1, Type: Story)
- AC: Every ZeptoMail send creates a permanent CRM Contact record (template, subject, timestamp, delivery status); survives beyond 60 days; queryable; SAR-exportable.
- Direction: Likely implementation is a custom subform on Contact (and Deal where applicable). Populated at send time by the mass-mailout workflow and by a Catalyst function for transactional sends. Coordinate model with FC-GOV-02 — one data structure for both requirements.
- Gating: FC-ZM-01 response (may affect approach if Zoho offers native retention).
- Priority: P1.

#### FC-ZM-04 — Compliance memo (P1, Type: Task)
- AC: One-page memo; Zoho response + remediation + residual risk; Ony sign-off; filed against FCA matter.
- Direction: Author: Sean. Reviewer: Ony. File location: WorkDrive compliance folder (confirm path). This is the artefact the FCA sees — write it for a regulator, not for internal audience.
- Gating: FC-ZM-01, FC-ZM-02, FC-ZM-03 landed.
- Priority: P1.

### Category 2 — FCA Recipient Recovery

#### FC-FCA-01 — Reconstruct, cross-check and remediate the affected recipient list(s) (P0, Type: Story)
- AC (verbatim from CR): Recipient list reconstructed by scripted search of CRM Contact/Deal timeline; reconstruction reproducible; cross-checked against filter criteria + Desk thread search; permanent custom field `FCA_Promo_Oct2025 = TRUE`; cross-checked against Books/CRM cancellation invoices; for every match, claim closed + invoice reversed/credited + client contacted per Ony's direction; remediation log produced for FCA disclosure.
- Direction:
  - **Cohort** — clients whose lead criteria fall in **6–28 Aug 2025** (plus excluded lead sources). Mailout itself sent **16 Oct 2025**. Exact filter parameters to be locked from Tony's candidate spreadsheet and triangulated against CRM workflow Timeline history.
  - Reconstruction sources (priority order): (1) CRM workflow "MassEmail via ZeptoMail" trigger history on "Mass Email Clients" picklist field — Timeline history on Contact records; (2) Zia search for template subject line; (3) original filter spreadsheet from Laura (Tony is searching); (4) Desk thread search on subject line as secondary verification.
  - **Reproducibility** — whatever script or ZCQL query reconstructs the list is checked into `scripts/` so the method is evidential, not one-shot.
  - **Cross-check** — match against Books invoices via email AND Contact ID AND Deal ID (all three, not just one — email addresses change).
  - **Remediation log** — CSV with: Contact ID, Deal ID, email, mailout date, invoice ID (if any), action taken, actioned-by, timestamp, client-contact method.
- Gating: Filter criteria locked from Tony's spreadsheet. Access to Books cancellation invoice export.
- Priority: **P0** — FCA meeting deadline.

### Category 3 — Mass-Mailout Governance

#### FC-GOV-01 — Mandatory recipient snapshot at send time (P2, Type: Story)
- AC: Any mass send >50 recipients produces a CSV snapshot at send time (Contact/Deal ID, email, send timestamp, template, mailout ref ID); stored in WorkDrive in dated folder structure; 6-year retention; **no mass send executable without snapshot** (hard pre-send check).
- Direction: Implementation as a Catalyst function invoked by the "MassEmail via ZeptoMail" workflow before the ZeptoMail send step. Workflow aborts if snapshot function returns non-200. Snapshot filename convention: `YYYY-MM-DD_<mailoutRefId>_<templateName>.csv`. Consider an operator preview artefact generated at the same time (human-readable summary).
- Gating: FC-ZM-02 storage-target decision (WorkDrive path structure must match).
- Priority: P2 (preventative — but can start scoping now, architecture waits on FC-ZM-02).

#### FC-GOV-02 — Replace tag-based mailout flagging with custom field (P2, Type: Story)
- AC: New structured field `Mass_Mailout_History` on Contact (and Deal) — subform or multi-line — recording mailout ref ID, date, template, per-recipient delivery status. Tags may remain for operational filter. No retrospective migration.
- Direction: Align data structure with FC-ZM-03 (single model serves both). Build as CRM subform. Populated by Catalyst function at send time (same function as FC-GOV-01).
- Gating: FC-ZM-03 data model locked.
- Priority: P2.

#### FC-GOV-03 — Workflow execution history export (P2, Type: Task)
- AC: MassEmail workflow execution history exported on same 6-year retention schedule; stored with mailout snapshots; runbook explains reconciliation against snapshots.
- Direction: Workflow execution history retention is only 90 days native — so same daily export pattern as FC-ZM-02. Reuse the pipeline if technically feasible.
- Gating: FC-ZM-02 live.
- Priority: P2.

#### FC-GOV-04 — Mass mailout SOP (P2, Type: Task)
- AC: SOP covering filter sign-off → snapshot → template sign-off → send authorisation → post-send verification → evidence filing. Ony signed. Filed in WorkDrive. Referenced in induction for authorised operators.
- Direction: Author: Sean. Reviewer: Ony. Produce after FC-GOV-01 and FC-GOV-02 are live so the SOP reflects actual controls, not aspirational ones.
- Gating: FC-GOV-01, FC-GOV-02 live.
- Priority: P2.

---

## 4. Dependency Graph

```
FC-FCA-01 (P0) ──── independent ──── starts once Section 1 resolved
                                          │
                                          ▼
                                    FCA meeting
                                    (week of 27 Apr)

FC-ZM-01 (P1)
    │
    ├─► FC-ZM-02 (P1) ──► FC-GOV-01 (P2) ──► FC-GOV-04 (P2)
    │                        │
    ├─► FC-ZM-03 (P1) ──► FC-GOV-02 (P2) ──┘
    │                        │
    │                     FC-GOV-03 (P2)
    │
    └─► FC-ZM-04 (P1) — after ZM-02/03 land
```

---

## 5. Priority Sequence (for sprint intake order)

| Order | Card | Rationale |
|---|---|---|
| 1 | FC-FCA-01 | FCA meeting deadline. Must have an evidence pack in hand. |
| 2 | FC-ZM-01 | Gates all downstream Category 1 design. |
| 3 | FC-GOV-01 | Can scope in parallel — prevents recurrence of the very problem that caused the FCA issue. |
| 4 | FC-ZM-02 | After Zoho response received. |
| 5 | FC-ZM-03 | After Zoho response received — coordinate data model with FC-GOV-02. |
| 6 | FC-GOV-02 | After FC-ZM-03 data model locked. |
| 7 | FC-GOV-03 | After FC-ZM-02 export pipeline live. |
| 8 | FC-ZM-04 | After all Category 1 work demonstrable. |
| 9 | FC-GOV-04 | SOP last — reflects real controls. |

---

## 6. Open Questions / Risks

1. **Original filter criteria** — Tony located a candidate spreadsheet but is not certain it is the right one. No email/Cliq trail exists. Risk: reconstructed list may be incomplete if filter differed. Mitigation: triangulate from workflow Timeline history (primary) + spreadsheet (secondary) + Desk thread (tertiary).
2. **Storage target** — WorkDrive vs Catalyst DataStore for log archive. Affects FC-ZM-02, FC-GOV-01, FC-GOV-03. Owner: Sean to decide once Zoho response in hand.
3. **Scope of prior mailouts** — CR excludes mass mailouts prior to 16 Oct 2025 from reconstruction; this may be expanded by the FCA after the meeting. Contingency plan: FC-FCA-01 methodology is reproducible, so prior mailouts can be reconstructed on the same pattern.
4. **Migration-away contingency** — If Zoho confirms no remediation path on ZeptoMail, migration is in-scope. Out-of-scope for now but carry as a known contingency.
5. **Books integration for invoice reversal** — FC-FCA-01 requires reversing/crediting cancellation invoices. Confirm the reversal process is Books-native or requires manual accounting entry. Coordinate with CFO / Business Analyst agent.

---

## 7. Next Actions — Week of 24 Apr

| When | Who | Action |
|---|---|---|
| 24 Apr (today) | Sean | Lock filter criteria (lead-creation window 6–28 Aug 2025 + excluded lead sources) from Tony's spreadsheet as source of truth. |
| ✅ 24 Apr | Sean | Sprint cards intake complete (9 cards in Zoho Sprints, Fair Claims project). |
| 25 Apr | Sean | Chase Zoho Support ticket (FC-ZM-01). Escalate to account manager if no response. |
| 25–27 Apr | Assigned dev | FC-FCA-01 reconstruction — produce draft recipient list + evidence pack. |
| 27 Apr EOD | Sean + Ony | Evidence pack review. Sign off remediation log before FCA meeting. |
| w/c 27 Apr | Sean | FCA meeting. Pack produced from FC-FCA-01 + FC-ZM-04 draft. |

Flag the preferred option and the inputs above, and the cards can be created in a single pass.
