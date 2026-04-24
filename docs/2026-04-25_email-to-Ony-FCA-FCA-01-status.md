**To:** Ony
**From:** Sean
**Date:** 25 April 2026
**Subject:** FCA matter — 16 Oct 2025 mailout: recipient list reconstructed (2,818); next steps + a related CR I'd like to raise

Ony,

Quick status on the FCA workstream ahead of next week's meeting, plus one new item I'd like your sign-off on.

## What we did

The Change Request you approved on Thursday tasked us with reconstructing the recipient list of the 16 October 2025 "Important Update Regarding Promotions" mailout, in advance of the FCA meeting. ZeptoMail had purged its logs (60-day retention — that's the very issue the broader CR is solving), and the obvious CRM-side sources were dead too: the trigger picklist field on Contact is overwritten the moment the email sends, and the field was configured without history tracking, so there's no audit log of historical values either. Workflow execution view only retains 90 days, so Oct 16 is long gone there.

The recoverable artefact turned out to be a **CRM tag** — `FCA Update Promo` — which the workflow rule applies to every Contact at the moment of send. Tags accumulate (the workflow uses `over_write: false`) and there is no automated tag-removal anywhere in the chain. So unlike the picklist, the tag survived the seven subsequent campaigns and is still on every recipient.

## What we got

- **2,818 Contacts** currently bear the `FCA Update Promo` tag. That is the recipient list. (The verbal estimate in the meeting was "around 2,500" — the actual is 2,818.)
- All 2,818 were created on or before 16 Oct 2025 — sanity-checked.
- One recipient (Paul Aldridge) was independently confirmed via a Zoho Desk reply ticket (#87471, 16 Oct 11:07am) — cross-source agreement.
- Full evidence pack lives in the repo at `evidence/2026-04-25_fca-promo-oct2025/` — workflow rule definition, the Deluge function source, picklist definition, frozen counts, Desk results, methodology narrative. Everything reproducible by an external auditor.

## What's next on FC-FCA-01

1. Bulk-export the 2,818 to CSV with a tamper-evident hash. Blocked on a CRM custom-view ID from me, or an OAuth token — quick to unblock.
2. **Books cross-check** — match the 2,818 against cancellation invoices issued from 16 Oct 2025 onwards. This is the list you'll actually action: any recipient who got an invoice they shouldn't have. Blocked on Books API access; same shape, fast to unblock.
3. You and I review the master list and the remediation candidates **before any state change** in CRM or Books.
4. Per-recipient remediation per your direction: invoice reversal, claim closure, client contact. Logged per recipient.

## A new CR I'd like to raise — FC-FCA-02

The same audit-trail technique that just rescued us on Oct 16 should be applied to **every prior ZeptoMail campaign since this workflow went live**, while we still have whatever survives. There are eight other campaigns: Claims Overview, Redress Scheme, Happy New Year, Diesel Emissions, three March 2026 sends, and the April 2026 Customer Portal. Bluntly: we got lucky on Oct 16 because someone added a tag-action to that one workflow condition. **None of the other eight conditions has a tag-action.** So for those, we may have nothing recoverable at all — but we won't know until we look.

The new CR (suggested ID **FC-FCA-02**) is: audit each prior campaign for any persistent artefact (tag, custom field, related Note/Activity, anything) that lets us identify the recipients. Reconstruct what we can. Document what we can't, so when the FCA inevitably broadens scope we already know the answer — and we have a defensible record that we systematically tried.

## Reminding you of the broader CR — this is the bigger picture

The Oct 16 reconstruction worked, but it worked on a single tag added in October by a person who happened to be thinking about audit. That is **not** a control. The broader CR you approved (the one with the FC-ZM and FC-GOV cards) is what makes sure we never depend on luck again:

- **FC-ZM-01..04** — six-year ZeptoMail log retention, daily export pipeline, per-Contact CRM timeline records, compliance memo. This makes the next "60-day purge" non-events.
- **FC-GOV-01..04** — mandatory recipient snapshot at every mass-send, structured `Mass_Mailout_History` field replacing tag-based flagging as audit source-of-truth, workflow execution-history export, signed SOP. This makes "we forgot to add a tag" never matter again.

We should not let the success of the FC-FCA-01 reconstruction take pressure off these. They are the actual fix.

## And, with respect

The reason we are spending the week before an FCA meeting reconstructing a list that should never have needed reconstructing is that the original mass-email mechanism was built without any of the basic audit primitives — no field history, no recipient snapshot, no log retention beyond what the email provider chose to give us. It worked, and then it sat. When the regulator turned around, we discovered the shape of what we'd built.

I'll put it as politely as I can: **mass communications to thousands of regulated clients should not be set up by people who don't carry compliance accountability for the consequences**, and going forward the FC-GOV cards exist to ensure that is structurally enforced rather than left to the discretion of whoever happens to be in the workflow editor that day. Your sign-off is the right place to backstop this — anything mass-send-related, end-to-end review by you (or whoever you delegate) before it goes live. We can bake that into FC-GOV-04 (the SOP) explicitly if you want.

Happy to walk through any of this in person before the FCA meeting. Evidence pack is in the repo, ready for your review.

Sean
