import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { decryptDetails, encryptDetails } from '../../src/lib/server/payment-security';
import {
  activeParticipation,
  findPaidNomination,
  insertParticipation,
  saveParticipationTransaction,
  type ParticipationDetails
} from '../../src/lib/server/participation-store';

// Optional, isolated PostgreSQL WASM runner. It never connects to Neon or any provider.
// Supply a locally installed @electric-sql/pglite dist/index.js with BWA_PGLITE_MODULE.
let database: {
  exec: (sql: string) => Promise<unknown>;
  query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  close: () => Promise<void>;
};
vi.mock('../../src/lib/server/payment-store', async (original) => ({
  ...(await original<typeof import('../../src/lib/server/payment-store')>()),
  findPayment: async (id: string) =>
    (await database.query('SELECT * FROM bwa.nomination_payments WHERE id = $1::uuid', [id]))
      .rows[0],
  db:
    () =>
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const query = strings.reduce(
        (sql, part, index) => sql + (index ? `$${index}` : '') + part,
        ''
      );
      return (await database.query(query, values)).rows;
    }
}));
async function nomination(
  options: {
    website?: string;
    email?: string;
    state?: string;
    createdHours?: number;
    paidHours?: number;
    app?: string;
  } = {}
) {
  const id = randomUUID();
  const details = encryptDetails(
    {
      submission: {
        website: options.website || 'https://www.example.com',
        email: options.email || 'stored@example.com',
        name: 'Example Entrant',
        organisation: 'Example Ltd',
        phone: '0770000000'
      }
    },
    id
  );
  await database.query(
    `INSERT INTO bwa.nomination_payments (id,owner_hash,details,amount,currency,terms_version,app_id,merchant_id,sandbox,state,created_at,paid_at)
    VALUES ($1,$2,$3,285000,'LKR','test',$4,'merchant',false,$5,$6,$7)`,
    [
      id,
      'ab'.repeat(32),
      details,
      options.app || 'app',
      options.state || 'paid',
      new Date(Date.now() - (options.createdHours ?? 48) * 3600_000).toISOString(),
      new Date(Date.now() - (options.paidHours ?? 24) * 3600_000).toISOString()
    ]
  );
  return id;
}
describe.skipIf(!process.env.BWA_PGLITE_MODULE)(
  'isolated participation PostgreSQL integration',
  () => {
    beforeAll(async () => {
      const { PGlite } = await import(/* @vite-ignore */ process.env.BWA_PGLITE_MODULE!);
      database = new PGlite();
      vi.stubEnv('PAYMENT_DATA_KEY', 'ab'.repeat(32));
      vi.stubEnv(
        'GENIE_API_KEY',
        `eyJ.${Buffer.from(JSON.stringify({ appId: 'app', companyId: 'merchant' })).toString('base64url')}.signature`
      );
      vi.stubEnv('GENIE_APP_ID', 'app');
      vi.stubEnv('GENIE_API_BASE_URL', 'https://api.geniebiz.lk');
      vi.stubEnv('PAYMENT_SITE_URL', 'https://bestwebsiteaward.com');
      await database.exec(await readFile('migrations/001_nomination_payments.sql', 'utf8'));
      const migration = await readFile('migrations/004_participation_payments.sql', 'utf8');
      await database.exec(migration);
      await database.exec(migration);
    }, 30_000);
    beforeEach(async () => {
      await database.exec(
        'TRUNCATE bwa.participation_payments, bwa.participation_nomination_index, bwa.nomination_payments'
      );
    });
    afterAll(async () => {
      await database?.close();
      vi.unstubAllEnvs();
    });
    it('selects the latest paid details, ignoring newer unpaid and other-app submissions', async () => {
      await nomination({ email: 'older@example.com', createdHours: 72 });
      const latest = await nomination({
        email: 'latest@example.com',
        createdHours: 48,
        website: 'http://EXAMPLE.COM/shop/?utm_source=mail'
      });
      await nomination({ email: 'unpaid@example.com', state: 'pending', createdHours: 1 });
      await nomination({ email: 'other-app@example.com', app: 'other', createdHours: 0 });
      const found = await findPaidNomination('example.com');
      expect(found.id).toBe(latest);
      expect(
        decryptDetails<{ submission: { email: string } }>(found.details, found.id).submission.email
      ).toBe('latest@example.com');
    });
    it('does not fall back to an older eligible nomination when the latest paid entry is too recent', async () => {
      await nomination({ createdHours: 72, paidHours: 48 });
      await nomination({ createdHours: 2, paidHours: 1 });
      await expect(findPaidNomination('example.com')).rejects.toThrow('not eligible');
    });
    it('uses the same rejection for unpaid, missing and too-recent nominations', async () => {
      await nomination({ state: 'pending' });
      await expect(findPaidNomination('example.com')).rejects.toThrow('not eligible');
      await expect(findPaidNomination('absent.example')).rejects.toThrow('not eligible');
    });
    it('refreshes the latest eligible details at checkout', async () => {
      const older = await nomination({ createdHours: 72, email: 'old@example.com' });
      const latest = await nomination({ createdHours: 48, email: 'latest@example.com' });
      const { record } = await insertParticipation(older, 'ab'.repeat(32), {
        packageCode: 'C',
        extraTrophy: true,
        attendees: 3
      });
      expect(record.nomination_id).toBe(latest);
      expect(record.amount).toBe(7_885_000);
      expect(
        decryptDetails<ParticipationDetails>(record.details, `participation:${record.id}`).email
      ).toBe('latest@example.com');
    });
    it('allows only one active participation across concurrent requests', async () => {
      const id = await nomination();
      const choice = { packageCode: 'A' as const, extraTrophy: false, attendees: 1 };
      const results = await Promise.all(
        Array.from({ length: 4 }, () => insertParticipation(id, 'ab'.repeat(32), choice))
      );
      expect(results.filter((row) => row.created)).toHaveLength(1);
      expect(new Set(results.map((row) => row.record.id)).size).toBe(1);
      await expect(insertParticipation(id, 'cd'.repeat(32), choice)).rejects.toThrow(
        'not available in this browser'
      );
    });
    it('enforces package C minimum, maximum 10, and exact totals in the database itself', async () => {
      const id = await nomination();
      const { record } = await insertParticipation(id, 'ab'.repeat(32), {
        packageCode: 'C',
        extraTrophy: false,
        attendees: 2
      });
      for (const patch of [
        'attendees = 1',
        'attendees = 11',
        'amount = 1',
        "package_code = 'A', extra_trophy = true"
      ])
        await expect(
          database.query(`UPDATE bwa.participation_payments SET ${patch} WHERE id=$1`, [record.id])
        ).rejects.toThrow();
    });
    it('keeps paid state monotonic and sends refunds to review without enabling another charge', async () => {
      const id = await nomination();
      let { record } = await insertParticipation(id, 'ab'.repeat(32), {
        packageCode: 'B',
        extraTrophy: false,
        attendees: 2
      });
      const transaction = { id: '65c509dcf003980008fbb808', state: 'CONFIRMED' };
      record = await saveParticipationTransaction(record, transaction, 'paid');
      record = await saveParticipationTransaction(
        record,
        { ...transaction, state: 'CANCELLED' },
        'failed'
      );
      expect(record.state).toBe('paid');
      expect(record.provider_state).toBe('CONFIRMED');
      record = await saveParticipationTransaction(
        record,
        { ...transaction, state: 'REFUNDED' },
        'review'
      );
      expect(record.state).toBe('review');
      expect((await activeParticipation(record.website_key))?.id).toBe(record.id);
    });
  }
);
