# Fair Claims — ZeptoMail Retention, FCA Recipient Recovery & Mass-Mailout Governance

Workstream repository for the CR raised 22 Apr 2026 and approved 24 Apr 2026.

**Live FCA matter.** Meeting with FCA in the week commencing 27 Apr 2026. Work in this repo produces the evidence pack presented to the regulator and the remediation plan for long-term compliance.

## Scope at a glance

| Workstream | Tag | Summary |
|---|---|---|
| ZeptoMail retention | `FC-ZM` | 6-year immutable log retention to meet FCA + UK GDPR obligations. |
| FCA recipient recovery | `FC-FCA` | Reconstruct mass-email recipient list(s), reverse wrongly-issued cancellation invoices, produce FCA evidence pack. **P0.** |
| Mass-mailout governance | `FC-GOV` | Permanent preventative controls so this cannot recur. |

Full direction, task breakdown, dependencies and priority sequence: **[docs/FCA-ZeptoMail-CR-Direction.md](docs/FCA-ZeptoMail-CR-Direction.md).**

## Repository layout

```
.
├── README.md                       — this file
├── docs/
│   ├── FCA-ZeptoMail-CR-Direction.md   — direction doc (single source of truth for sprint intake)
│   ├── cr/                             — approved CR text + any future amendments
│   └── transcripts/                    — meeting transcripts + Fathom recording links
├── scripts/                        — reconstruction scripts, export pipelines, reproducible queries
├── exports/                        — daily ZeptoMail log exports (once FC-ZM-02 is live; gitignored if large)
└── evidence/                       — FCA evidence pack artefacts (reconstructed lists, remediation logs)
```

**Rule of thumb:** if it's a decision, a plan, or a written artefact — it goes in `docs/`. If it's code — it goes in `scripts/`. If it's data produced by a pipeline — it goes in `exports/` or `evidence/`.

## Current status (updated 25 Apr 2026)

- [x] CR raised and approved
- [x] Direction doc written
- [x] Scope clarified — one email sent 16 Oct 2025 to a cohort filtered by 6–28 Aug 2025 lead criteria
- [x] Zoho Sprints cards intake (9 cards in Fair Claims project)
- [x] **FC-FCA-01 recipient list reconstructed: 2,818 Contacts** — see [evidence/2026-04-25_fca-promo-oct2025/](evidence/2026-04-25_fca-promo-oct2025/README.md). Tag-based; cross-confirmed.
- [ ] Bulk-export the 2,818 to CSV with SHA-256 (blocked on CRM REST API access OR a custom view + cvid)
- [ ] Books cross-check against post-16 Oct cancellation invoices (blocked on Books REST API access)
- [ ] Sean + Ony review of master list before any state change
- [ ] Per-recipient remediation actions + remediation log
- [ ] Email summary to Ony with reminder of broader CR cards + new prior-campaign audit CR (FC-FCA-02 to be raised)

## Related

- Zoho Sprints workspace: CoolRunnings Business Solutions (`teamId 7000238134`)
- Suggested item prefix: `FCZM`
- Meeting recording (22 Apr 2026): https://fathom.video/share/3EaSspK3nt5Rq7WcJi_od6SsMsWb8Riv
