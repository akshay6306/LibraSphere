import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Books Endpoints', () => {
  it('GET /api/v1/books should return 200 with pagination structure', async () => {
    const res = await request(app).get('/api/v1/books?limit=5');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
  });

  it('GET /api/v1/reports/overview should return system statistics', async () => {
    const res = await request(app).get('/api/v1/reports/overview');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalBooks');
  });
});
