import { describe, expect, it } from 'vitest';
import { InvalidEnvError, parseEnv } from '../../../src/config/env-schema.js';

const REQUIRED = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
};

describe('parseEnv', () => {
  it('should apply defaults when only required variables are provided', () => {
    expect(parseEnv(REQUIRED)).toEqual({
      ...REQUIRED,
      NODE_ENV: 'development',
      PORT: 3333,
      JWT_EXPIRES_IN: '1h',
    });
  });

  it('should coerce PORT from string to number', () => {
    expect(parseEnv({ ...REQUIRED, PORT: '8080' }).PORT).toBe(8080);
  });

  it('should reject a missing DATABASE_URL', () => {
    expect(() => parseEnv({ JWT_SECRET: REQUIRED.JWT_SECRET })).toThrow(InvalidEnvError);
  });

  it('should reject a DATABASE_URL that is not PostgreSQL', () => {
    expect(() => parseEnv({ ...REQUIRED, DATABASE_URL: 'mysql://user:pass@localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('should reject a non-numeric PORT', () => {
    expect(() => parseEnv({ ...REQUIRED, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('should reject an unknown NODE_ENV', () => {
    expect(() => parseEnv({ ...REQUIRED, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('should reject a JWT_SECRET shorter than 32 characters', () => {
    expect(() => parseEnv({ ...REQUIRED, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it.each(['1 hour', '60', 'h1'])('should reject an invalid JWT_EXPIRES_IN (%s)', (value) => {
    expect(() => parseEnv({ ...REQUIRED, JWT_EXPIRES_IN: value })).toThrow(/JWT_EXPIRES_IN/);
  });

  it('should report every invalid variable at once', () => {
    expect(() => parseEnv({ PORT: 'abc' })).toThrow(
      /PORT[\s\S]*DATABASE_URL|DATABASE_URL[\s\S]*PORT/,
    );
  });
});
