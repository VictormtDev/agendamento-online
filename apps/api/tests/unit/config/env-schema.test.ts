import { describe, expect, it } from 'vitest';
import { InvalidEnvError, parseEnv } from '../../../src/config/env-schema.js';

const VALID_DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';

describe('parseEnv', () => {
  it('should apply defaults when only DATABASE_URL is provided', () => {
    expect(parseEnv({ DATABASE_URL: VALID_DATABASE_URL })).toEqual({
      NODE_ENV: 'development',
      PORT: 3333,
      DATABASE_URL: VALID_DATABASE_URL,
    });
  });

  it('should coerce PORT from string to number', () => {
    const env = parseEnv({ DATABASE_URL: VALID_DATABASE_URL, PORT: '8080' });

    expect(env.PORT).toBe(8080);
  });

  it('should reject a missing DATABASE_URL', () => {
    expect(() => parseEnv({})).toThrow(InvalidEnvError);
  });

  it('should reject a DATABASE_URL that is not PostgreSQL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://user:pass@localhost:3306/db' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('should reject a non-numeric PORT', () => {
    expect(() => parseEnv({ DATABASE_URL: VALID_DATABASE_URL, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('should reject an unknown NODE_ENV', () => {
    expect(() => parseEnv({ DATABASE_URL: VALID_DATABASE_URL, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('should report every invalid variable at once', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(
      /PORT[\s\S]*DATABASE_URL|DATABASE_URL[\s\S]*PORT/,
    );
  });
});
