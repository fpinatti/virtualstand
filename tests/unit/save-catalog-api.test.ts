import fs from 'fs';
import { POST } from '@/../app/api/save-catalog+api';

describe('POST /api/save-catalog (Feature 012 Dev Endpoint)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects invalid or null payload', async () => {
    const req = new Request('http://localhost/api/save-catalog', {
      method: 'POST',
      body: JSON.stringify(null),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('persists catalog snapshot directly to assets/data/virtualstand-catalog.json', async () => {
    let writtenData = '';
    jest.spyOn(fs, 'writeFileSync').mockImplementation((_path, data) => {
      writtenData = String(data);
    });

    const dummyCatalog = {
      version: 1,
      exportedAt: new Date().toISOString(),
      totalGames: 1,
      games: [{ bggId: 123, title: 'Test Game' }],
    };

    const req = new Request('http://localhost/api/save-catalog', {
      method: 'POST',
      body: JSON.stringify(dummyCatalog),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(writtenData).not.toBe('');

    const saved = JSON.parse(writtenData);
    expect(saved.totalGames).toBe(1);
    expect(saved.games[0].title).toBe('Test Game');
  });
});
