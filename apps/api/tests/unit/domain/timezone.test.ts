import { describe, expect, it } from 'vitest';
import { isValidTimezone } from '../../../src/domain/timezone.js';

describe('isValidTimezone', () => {
  it.each(['America/Sao_Paulo', 'America/Manaus', 'Europe/Lisbon', 'UTC'])(
    'should accept the IANA name %s',
    (timezone) => {
      expect(isValidTimezone(timezone)).toBe(true);
    },
  );

  it('should not allow fixed offsets, which ignore daylight saving changes', () => {
    expect(isValidTimezone('-03:00')).toBe(false);
    expect(isValidTimezone('+00:00')).toBe(false);
  });

  it('should not allow aliases or case variants of a canonical name', () => {
    expect(isValidTimezone('Brazil/East')).toBe(false);
    expect(isValidTimezone('america/sao_paulo')).toBe(false);
  });

  it.each(['Mars/Olympus', '', 'Sao Paulo'])('should reject the unknown zone %j', (timezone) => {
    expect(isValidTimezone(timezone)).toBe(false);
  });
});
