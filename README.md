# Negotiators Express CRM

Personal claims CRM for BB's property-insurance negotiation business.
Single-file app (`index.html`) — pipeline, contacts, follow-ups, and fee tracking.

- Live app: published as a Claude artifact (data syncs across devices via the artifact database).
- Opened as a plain file, it still works and saves to the browser on that device.

## Data model
- `claims/{id}` — claimant, loss type, carrier, claim #, stage (Lead → Signed → Estimate → Submitted → Negotiating → Settled → Paid / Lost), estimate / offer / settled $, fee % or fee override, next action + date, notes
- `contacts/{id}` — name, role (Claimant, Adjuster, Public Adjuster, Contractor, Attorney, Referral Source, Carrier Rep), company, phone, email
- `tasks/{id}` — follow-up title, due date, linked claim, done
