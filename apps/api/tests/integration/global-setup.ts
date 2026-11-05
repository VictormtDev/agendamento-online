import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Runs once before all integration files: brings the test database to the latest schema.
export default function setup(): void {
  const testEnv = parseEnv(readFileSync('.env.test', 'utf8'));
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, ...testEnv },
    stdio: 'pipe',
  });
}
