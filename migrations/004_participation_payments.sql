CREATE TABLE IF NOT EXISTS bwa.participation_nomination_index (
  nomination_id uuid PRIMARY KEY REFERENCES bwa.nomination_payments(id),
  website_key char(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS participation_nomination_website_idx ON bwa.participation_nomination_index(website_key);
CREATE TABLE IF NOT EXISTS bwa.participation_payments (
  id uuid PRIMARY KEY,
  nomination_id uuid NOT NULL REFERENCES bwa.nomination_payments(id),
  website_key char(64) NOT NULL,
  owner_hash char(64) NOT NULL,
  details text NOT NULL,
  package_code char(1) NOT NULL CHECK (package_code IN ('A','B','C')),
  extra_trophy boolean NOT NULL,
  attendees integer NOT NULL CHECK (attendees BETWEEN 1 AND 10),
  amount integer NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL CHECK (currency = 'LKR'),
  terms_version text NOT NULL,
  app_id text NOT NULL,
  merchant_id text NOT NULL,
  sandbox boolean NOT NULL,
  transaction_id text UNIQUE,
  checkout_url text,
  state text NOT NULL DEFAULT 'creating' CHECK (state IN ('creating','pending','paid','failed','review')),
  provider_state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  check_after timestamptz NOT NULL DEFAULT now(),
  email_first_attempt_at timestamptz,
  email_lock_until timestamptz,
  customer_email_id text,
  team_email_id text,
  CHECK (package_code <> 'C' OR attendees >= 2),
  CHECK (NOT extra_trophy OR package_code = 'C'),
  CHECK (amount = (CASE WHEN package_code = 'C' THEN 6000000 ELSE 3750000 END)
    + (attendees - CASE WHEN package_code = 'C' THEN 2 ELSE 1 END) * 635000
    + CASE WHEN extra_trophy THEN 1250000 ELSE 0 END)
);
CREATE UNIQUE INDEX IF NOT EXISTS participation_single_active_website ON bwa.participation_payments(website_key, app_id, sandbox) WHERE state IN ('creating','pending','paid','review');
CREATE INDEX IF NOT EXISTS participation_recovery_idx ON bwa.participation_payments(check_after) WHERE state IN ('creating','pending','paid');
CREATE TABLE IF NOT EXISTS bwa.participation_lookup_limits (
  key char(64) PRIMARY KEY,
  hits integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes'
);
REVOKE ALL ON bwa.participation_nomination_index, bwa.participation_payments, bwa.participation_lookup_limits FROM PUBLIC;
