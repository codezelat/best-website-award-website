-- Records nomination fees collected outside the Genie checkout. These are
-- kept separate from provider-confirmed nomination_payments records.
CREATE TABLE IF NOT EXISTS bwa.manual_nomination_eligibility (
  id uuid PRIMARY KEY,
  website_key char(64) NOT NULL UNIQUE,
  details text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL CHECK (currency = 'LKR'),
  collected_on date NOT NULL,
  recorded_by text NOT NULL,
  evidence_note text NOT NULL,
  app_id text NOT NULL,
  merchant_id text NOT NULL,
  sandbox boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON bwa.manual_nomination_eligibility FROM PUBLIC;

ALTER TABLE bwa.participation_payments ALTER COLUMN nomination_id DROP NOT NULL;
ALTER TABLE bwa.participation_payments
  ADD COLUMN IF NOT EXISTS manual_eligibility_id uuid
  REFERENCES bwa.manual_nomination_eligibility(id);
ALTER TABLE bwa.participation_payments
  DROP CONSTRAINT IF EXISTS participation_nomination_source_check;
ALTER TABLE bwa.participation_payments
  ADD CONSTRAINT participation_nomination_source_check
  CHECK ((nomination_id IS NULL) <> (manual_eligibility_id IS NULL));
