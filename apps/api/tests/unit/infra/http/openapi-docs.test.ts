import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../../src/infra/http/app.js';
import { createFakeDependencies } from '../../../fakes/create-fake-dependencies.js';

interface RouteLayer {
  route?: { path: string; methods: Record<string, boolean> };
  handle?: { stack?: RouteLayer[] };
}

// Express keeps no public list of routes, so this walks the router internals. Every API
// router is mounted at /api/v1, which is why the prefix is added here.
function registeredOperations(app: Express): string[] {
  const appRouter = (app as unknown as { router: { stack: RouteLayer[] } }).router;
  return appRouter.stack.flatMap((mounted) =>
    (mounted.handle?.stack ?? []).flatMap(({ route }) =>
      route
        ? Object.keys(route.methods).map(
            (method) => `${method.toUpperCase()} /api/v1${route.path.replace(/:(\w+)/g, '{$1}')}`,
          )
        : [],
    ),
  );
}

function documentedOperations(document: { paths: Record<string, object> }): string[] {
  return Object.entries(document.paths).flatMap(([path, item]) =>
    Object.keys(item).map((method) => `${method.toUpperCase()} /api/v1${path}`),
  );
}

describe('OpenAPI docs', () => {
  const app = createApp(createFakeDependencies());

  it('should serve an OpenAPI 3.1 document', async () => {
    const response = await request(app).get('/docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ openapi: '3.1.0', servers: [{ url: '/api/v1' }] });
  });

  it('should document every route the API registers, and only those', async () => {
    const response = await request(app).get('/docs/openapi.json');

    expect(documentedOperations(response.body as { paths: Record<string, object> }).sort()).toEqual(
      registeredOperations(app).sort(),
    );
  });

  it('should describe requests with the schemas that validate them', async () => {
    const response = await request(app).get('/docs/openapi.json');
    const body = response.body as {
      paths: Record<string, Record<string, { requestBody: { content: object } }>>;
    };

    expect(body.paths['/auth/register']?.post?.requestBody.content).toEqual({
      'application/json': {
        schema: expect.objectContaining({
          required: ['name', 'email', 'password'],
          properties: expect.objectContaining({
            role: { default: 'CLIENT', type: 'string', enum: ['CLIENT', 'PROVIDER'] },
          }) as unknown,
        }) as unknown,
      },
    });
  });

  it('should serve the Swagger UI at /docs', async () => {
    const response = await request(app).get('/docs/').redirects(1);

    expect(response.status).toBe(200);
    expect(response.text).toContain('swagger-ui');
  });
});
