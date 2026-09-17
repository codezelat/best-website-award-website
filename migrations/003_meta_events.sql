CREATE TABLE IF NOT EXISTS bwa.meta_consents (
  id text PRIMARY KEY,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bwa.meta_events (
  id text PRIMARY KEY,
  consent_id text NOT NULL REFERENCES bwa.meta_consents(id),
  payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  retry_after timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meta_events_pending ON bwa.meta_events (retry_after) WHERE sent_at IS NULL;
