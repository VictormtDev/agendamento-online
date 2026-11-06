import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/infra/http/app.js';
import { createFakeDependencies } from '../../../fakes/create-fake-dependencies.js';

describe('Serving the built frontend', () => {
  const webDistDir = mkdtempSync(path.join(tmpdir(), 'web-dist-'));
  mkdirSync(path.join(webDistDir, 'assets'));
  writeFileSync(path.join(webDistDir, 'index.html'), '<div id="root"></div>');
  writeFileSync(path.join(webDistDir, 'assets', 'app.js'), 'console.log(1);');
  const app = createApp(createFakeDependencies(), { webDistDir });

  afterAll(() => {
    rmSync(webDistDir, { recursive: true });
  });

  it('should serve the built assets', async () => {
    const response = await request(app).get('/assets/app.js');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('javascript');
  });

  it('should answer client-side routes with the SPA entry point', async () => {
    const response = await request(app).get('/providers/some-id');

    expect(response.status).toBe(200);
    expect(response.text).toBe('<div id="root"></div>');
  });

  it('should keep answering unknown API routes with the JSON 404', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: { code: 'ROUTE_NOT_FOUND' } });
  });

  it('should still serve the API and the docs', async () => {
    const health = await request(app).get('/api/v1/health');
    const docs = await request(app).get('/docs/openapi.json');

    expect(health.status).toBe(200);
    expect(docs.body).toMatchObject({ openapi: '3.1.0' });
  });
});
