# Meeting — 22 April 2026 (Impromptu Google Meet)

**Attendees:** Sean, Tony, Perry
**Recording:** https://fathom.video/share/3EaSspK3nt5Rq7WcJi_od6SsMsWb8Riv

This is the session that produced the CR. It is the authoritative source of two facts the CR itself does not capture clearly:

1. The free-cancellation offer email was sent **6–28 Aug 2025**, not 16 Oct 2025.
2. The 16 Oct 2025 "Important Update Regarding Promotions" email was a cases-on-hold notice for an advertising issue — not the free-cancellation offer.

See **§1 of [FCA-ZeptoMail-CR-Direction.md](../FCA-ZeptoMail-CR-Direction.md)** for the scope-resolution requirement this creates.

---

## Timestamped Notes

### 0:04 — ZeptoMail's 60-day email retention limitation
ZeptoMail only retains email records for 60 days, after which all records of sent emails are automatically deleted from both the CRM and ZeptoMail itself. Activity logs are retained for one year, but detailed email information (sender, recipient, timestamps, subject lines, opens, clicks) is not preserved beyond the 60-day window. Sean noted that retention can potentially be extended through additional storage and contacting Zoho support, but this capability was not previously explored.

### 3:25 — GDPR and FCA regulatory compliance crisis
Perry raised critical compliance concerns: under UK GDPR, email records must be retained for six years, yet ZeptoMail's 60-day deletion makes this impossible. More immediately, the FCA requires audit trails for regulatory inquiries, and the company has no way to demonstrate what emails were sent or to whom if regulators ask. Perry emphasised this is not optional — the inability to retain records is itself a data protection problem regulators will question.

### 5:01 — Proposed solutions for log retention
- Export email logs and save them to local devices for manual review
- Add log records directly to client files within the CRM
- Contact Zoho support to determine if retention can be extended via additional storage
- Automate download and archival of log files to prevent future data loss

Sean to draft a letter to Zoho support.

### 5:50 — September/October FCA "promotional" email campaign
In September/October, the company sent an email via ZeptoMail to approximately 2,500 clients notifying them that cases were being put on hold due to an advertising issue. Template titled **"Important Update Regarding Promotions"**, set up around **16 October 2025**. The FCA has now reopened this issue. No record of who received it, who opened it, or who sent it — logs deleted after 60 days.

### 10:40 — August free-cancellation email and compliance risk
An email was sent between **6 and 28 August 2025** offering free cancellation to clients with one claim, per FCA agreement. Some clients who received this free-cancellation email were subsequently sent a cancellation fee invoice. Without email records, the team cannot identify who received the original offer. Perry: some clients may have complained to the FCA about receiving conflicting messages (free vs. fee). Agreed resolution: close claims for anyone who would have received that email within the specified timeframe.

### 14:12 — Workflow and system investigation for recipient identification
A workflow "MassEmail via ZeptoMail" exists with triggers for each campaign. Operates via a "Mass Email Clients" picklist on client records; when modified, it triggers the workflow, sends the email, and updates the field to "email sent." Timeline history on contact records shows when the workflow was triggered. Workflow view usage only displays ~90 days of history. Team attempting to use the workflow record, timeline history, and Zia search to identify recipients — difficult due to age and uncertainty about original recipient criteria.

### 18:09 — Locating the original recipient list
Team searching for the original spreadsheet created when the campaign was first set up — Laura provided filtered recipients. Tony found a candidate spreadsheet but is uncertain if it's the correct one. Original filtering criteria included lead creation date within a specific range and exclusion of certain lead sources; Tony cannot recall exact parameters. No email trail — discussions occurred over phone, email, and Cliq. Team using multiple search methods (Zia, workflow records, timeline tags) to reconstruct. At least one recipient confirmed in search results. Goal: definitive list so claims can be closed.

### 34:00 — Action items
- Sean: create support tickets for ZeptoMail retention, prioritise by importance
- Immediate goals: (1) locate complete recipient list for the October 16 email to close affected claims; (2) contact Zoho support about extending retention or automating log exports
- Tony: provide documentation and spreadsheets to support
- Sean: assign tickets to appropriate team member and follow up
