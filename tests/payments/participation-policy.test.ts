import { describe, expect, it } from 'vitest';
import {
  normaliseWebsite,
  participationQuote,
  type ParticipationChoice
} from '../../src/lib/participation/policy';

describe('participation website matching', () => {
  it.each([
    'example.com',
    'www.example.com',
    ' https://WWW.Example.COM/ ',
    'http://example.com',
    '//www.example.com/',
    'https://example.com:443/',
    'http://example.com:80',
    'https://example.com./',
    'https://example.com/shop/item?utm_source=email#details'
  ])('matches domain variants: %s', (value) => {
    expect(normaliseWebsite(value)).toBe('example.com');
  });
  it('keeps distinct domains and non-www subdomains separate', () => {
    expect(normaliseWebsite('shop.example.com')).toBe('shop.example.com');
    expect(normaliseWebsite('www.example.org')).toBe('example.org');
    expect(normaliseWebsite('example.com.evil.test')).toBe('example.com.evil.test');
  });
  it('normalises international domain names consistently', () => {
    expect(normaliseWebsite('https://bücher.de/')).toBe(normaliseWebsite('xn--bcher-kva.de'));
  });
  it.each([
    '',
    'example',
    'https://',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://user:password@example.com',
    'https://example.com@evil.test',
    'https://example.com:3000',
    'localhost',
    '127.0.0.1',
    'https://[::1]',
    'https://-bad.example.com',
    'https://exa mple.com',
    'https://example..com',
    'example.com\\@evil.test'
  ])('rejects ambiguous or invalid address %s', (value) => {
    expect(() => normaliseWebsite(value)).toThrow();
  });
});
describe('participation totals and enforced limits', () => {
  it.each(['A', 'B'] as const)('includes one attendee with package %s', (packageCode) => {
    expect(participationQuote({ packageCode, extraTrophy: false, attendees: 1 }).total).toBe(
      3_750_000
    );
    expect(participationQuote({ packageCode, extraTrophy: false, attendees: 10 }).total).toBe(
      9_465_000
    );
  });
  it('includes two attendees with C and prices the optional trophy once', () => {
    expect(participationQuote({ packageCode: 'C', extraTrophy: false, attendees: 2 }).total).toBe(
      6_000_000
    );
    expect(participationQuote({ packageCode: 'C', extraTrophy: true, attendees: 2 }).total).toBe(
      7_250_000
    );
    expect(participationQuote({ packageCode: 'C', extraTrophy: true, attendees: 10 }).total).toBe(
      12_330_000
    );
  });
  it('adds exactly 6,350 rupees for every additional attendee across all packages', () => {
    for (const packageCode of ['A', 'B', 'C'] as const)
      for (let attendees = packageCode === 'C' ? 2 : 1; attendees < 10; attendees++) {
        const first = participationQuote({ packageCode, extraTrophy: false, attendees });
        const next = participationQuote({
          packageCode,
          extraTrophy: false,
          attendees: attendees + 1
        });
        expect(next.total - first.total).toBe(635_000);
      }
  });
  it.each([0, -1, 11, 1.5, NaN, Infinity, '2', null])(
    'rejects invalid attendee value %s',
    (attendees) => {
      expect(() =>
        participationQuote({
          packageCode: 'A',
          extraTrophy: false,
          attendees
        } as ParticipationChoice)
      ).toThrow();
    }
  );
  it('never permits C below two or an extra trophy with A/B', () => {
    expect(() =>
      participationQuote({ packageCode: 'C', extraTrophy: false, attendees: 1 })
    ).toThrow();
    for (const packageCode of ['A', 'B'] as const)
      expect(() => participationQuote({ packageCode, extraTrophy: true, attendees: 2 })).toThrow();
  });
  it.each(['D', '__proto__', 'constructor', undefined, null])(
    'rejects invalid package %s',
    (packageCode) => {
      expect(() =>
        participationQuote({ packageCode, extraTrophy: false, attendees: 2 } as ParticipationChoice)
      ).toThrow();
    }
  );
});
