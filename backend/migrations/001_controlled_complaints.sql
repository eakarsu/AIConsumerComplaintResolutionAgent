BEGIN;
CREATE TABLE IF NOT EXISTS users (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS ai_results (id BIGSERIAL PRIMARY KEY, user_id BIGINT REFERENCES users(id), endpoint TEXT NOT NULL, request_params JSONB, result_text TEXT NOT NULL, model_used TEXT, tokens_used INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cr_organizations (id BIGSERIAL PRIMARY KEY, tenant_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cr_memberships (organization_id BIGINT NOT NULL REFERENCES cr_organizations(id), user_id BIGINT NOT NULL, role TEXT NOT NULL CHECK(role IN ('intake','agent','supervisor','admin','auditor')), PRIMARY KEY(organization_id,user_id));
CREATE TABLE IF NOT EXISTS cr_complaints (
 id BIGSERIAL PRIMARY KEY, organization_id BIGINT NOT NULL REFERENCES cr_organizations(id), external_reference TEXT,
 complainant_key TEXT NOT NULL, jurisdiction TEXT NOT NULL, product TEXT NOT NULL, channel TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','triaged','investigating','resolution_proposed','resolved','appealed','closed')),
 priority TEXT NOT NULL CHECK(priority IN ('low','normal','high','urgent')), due_at TIMESTAMPTZ NOT NULL,
 assigned_to BIGINT, version INTEGER NOT NULL DEFAULT 1, received_at TIMESTAMPTZ NOT NULL, created_by BIGINT NOT NULL, UNIQUE(organization_id,external_reference)
);
CREATE TABLE IF NOT EXISTS cr_evidence (id BIGSERIAL PRIMARY KEY, complaint_id BIGINT NOT NULL REFERENCES cr_complaints(id), kind TEXT NOT NULL, storage_key TEXT NOT NULL, sha256 TEXT NOT NULL, source TEXT NOT NULL, collected_at TIMESTAMPTZ NOT NULL, collected_by BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS cr_correspondence (id BIGSERIAL PRIMARY KEY, complaint_id BIGINT NOT NULL REFERENCES cr_complaints(id), direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')), channel TEXT NOT NULL, body_storage_key TEXT NOT NULL, content_hash TEXT NOT NULL, sent_at TIMESTAMPTZ, delivery_status TEXT NOT NULL CHECK(delivery_status IN ('received','queued','sent','failed')), failure_reason TEXT, created_by BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cr_resolutions (id BIGSERIAL PRIMARY KEY, complaint_id BIGINT NOT NULL REFERENCES cr_complaints(id), remedy TEXT NOT NULL, commitment_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK(commitment_amount >= 0), currency CHAR(3) NOT NULL DEFAULT 'USD', status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','approved','offered','accepted','rejected','executed')), rationale TEXT NOT NULL, proposed_by BIGINT NOT NULL, approved_by BIGINT, approved_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS cr_appeals (id BIGSERIAL PRIMARY KEY, complaint_id BIGINT NOT NULL REFERENCES cr_complaints(id), reason TEXT NOT NULL, requested_at TIMESTAMPTZ NOT NULL DEFAULT now(), requested_by TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewing','upheld','modified','denied')), reviewed_by BIGINT, outcome TEXT);
CREATE TABLE IF NOT EXISTS cr_outcomes (id BIGSERIAL PRIMARY KEY, complaint_id BIGINT NOT NULL REFERENCES cr_complaints(id), resolution_id BIGINT REFERENCES cr_resolutions(id), resolved_at TIMESTAMPTZ NOT NULL, resolution_days INTEGER NOT NULL CHECK(resolution_days >= 0), sla_met BOOLEAN NOT NULL, fairness_review TEXT, customer_feedback TEXT);
CREATE TABLE IF NOT EXISTS cr_audit_events (id BIGSERIAL PRIMARY KEY, organization_id BIGINT NOT NULL, complaint_id BIGINT, actor_id BIGINT, action TEXT NOT NULL, before_state JSONB, after_state JSONB, request_id TEXT, occurred_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS cr_connector_runs (id BIGSERIAL PRIMARY KEY, organization_id BIGINT NOT NULL, connector TEXT NOT NULL, idempotency_key TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('running','succeeded','failed','blocked')), cursor_value TEXT, failure JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(organization_id,connector,idempotency_key));
CREATE OR REPLACE FUNCTION cr_block_correspondence_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'complaint correspondence cannot be deleted'; END $$;
DROP TRIGGER IF EXISTS cr_correspondence_no_delete ON cr_correspondence;
CREATE TRIGGER cr_correspondence_no_delete BEFORE DELETE ON cr_correspondence FOR EACH ROW EXECUTE FUNCTION cr_block_correspondence_delete();
COMMIT;
