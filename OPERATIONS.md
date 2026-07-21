# Controlled complaint operations

The authoritative path is `/api/complaints`: tenant-scoped intake is idempotent, deterministic channel SLAs create due dates, evidence/correspondence hashes preserve the record, monetary resolutions require evidence and agent/supervisor approval, appeals preserve redress, and audit/connector-run tables capture state and failures. Correspondence deletion is blocked. Generated gap routes/navigation are quarantined; model drafts cannot make commitments.

Configure `.env.example`, bootstrap once, migrate explicitly, and use `start.sh`; startup performs no database or dependency mutation. Demo identities are not bundled and guarded seeding does not bypass controlled intake.

CRM/ticketing, identity, document storage, communications, refunds/payment and regulator exports require deployment-specific adapters with idempotency keys, encrypted storage, delivery/failure status, reconciliation and least-privilege credentials. Legal/regulatory deadline review, jurisdiction policy, fairness evaluation and real payment authorization remain external launch gates.
