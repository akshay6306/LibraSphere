import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/lib/prisma';

describe('Concurrency & Double-Borrow Prevention', () => {
  it('fires 20 parallel borrow requests for one copy and asserts exactly one succeeds', async () => {
    // 1. Login as librarian to obtain token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'librarian@libra.test', password: 'Librarian@123' });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.accessToken;

    // 2. Find an AVAILABLE copy with its barcode
    const availableCopy = await prisma.bookCopy.findFirst({
      where: { status: 'AVAILABLE' },
      include: { book: true }
    });

    expect(availableCopy).not.toBeNull();
    const barcode = availableCopy!.barcode;

    // 3. Get 20 distinct members
    const members = await prisma.member.findMany({
      take: 20,
      include: { user: true }
    });

    expect(members.length).toBeGreaterThanOrEqual(20);

    // 4. Fire 20 parallel borrow requests
    const promises = members.map((member, idx) =>
      request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${token}`)
        .send({
          copyBarcode: barcode,
          membershipId: member.membershipId,
          idempotencyKey: `test-concurrent-borrow-${barcode}-${idx}`
        })
    );

    const results = await Promise.all(promises);

    const successCount = results.filter((r) => r.status === 201 || (r.status === 200 && r.body.success)).length;
    const failCount = results.filter((r) => r.status >= 400).length;

    // Exactly 1 must succeed and the other 19 must fail
    expect(successCount).toBe(1);
    expect(failCount).toBe(19);

    // Verify copy is now BORROWED
    const updatedCopy = await prisma.bookCopy.findUnique({
      where: { barcode }
    });
    expect(updatedCopy?.status).toBe('BORROWED');
  }, 60000);
});
