import { GET } from '@/../app/api/scan-rulebooks+api';

describe('GET /api/scan-rulebooks (Feature 012 Dev Endpoint)', () => {
  it('returns all PDF rulebooks from assets/rulebooks/ directory', async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.files)).toBe(true);
    expect(data.files.length).toBeGreaterThanOrEqual(10);

    const first = data.files[0];
    expect(first.fileName).toMatch(/\.pdf$/i);
    expect(first.relativePath).toMatch(/^assets\/rulebooks\//);
    expect(first.fileSizeBytes).toBeGreaterThan(0);
  });
});
