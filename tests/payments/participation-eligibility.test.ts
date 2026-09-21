import { describe, expect, it } from 'vitest';
import { eligibleNomination } from '../../src/lib/server/participation-eligibility';
describe('participation eligibility delay', () => {
  const now = Date.parse('2026-09-22T12:00:00Z');
  it('becomes eligible exactly 12 hours after confirmed payment', () => {
    expect(
      eligibleNomination(
        { state: 'paid', paid_at: new Date(now - 12 * 3600_000).toISOString() },
        now
      )
    ).toBe(true);
    expect(
      eligibleNomination(
        { state: 'paid', paid_at: new Date(now - 12 * 3600_000 + 1).toISOString() },
        now
      )
    ).toBe(false);
  });
  it.each(['creating', 'pending', 'failed', 'review'] as const)(
    'rejects %s even with an old timestamp',
    (state) => {
      expect(eligibleNomination({ state, paid_at: '2026-09-01T00:00:00Z' }, now)).toBe(false);
    }
  );
  it('rejects absent, invalid, missing and future payment times', () => {
    expect(eligibleNomination(undefined, now)).toBe(false);
    for (const paid_at of [null, 'not-a-date', new Date(now + 1).toISOString()])
      expect(eligibleNomination({ state: 'paid', paid_at }, now)).toBe(false);
  });
});
