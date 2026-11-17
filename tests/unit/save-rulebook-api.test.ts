import fs from 'fs';
import path from 'path';
import { POST } from '@/../app/api/save-rulebook+api';

describe('POST /api/save-rulebook (Feature 012 Dev Endpoint)', () => {
  const testFileName = 'test-game-regras-ptbr.pdf';
  const targetPath = path.join(process.cwd(), 'assets', 'rulebooks', testFileName);

  afterEach(() => {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  });

  it('rejects requests with missing fileName or content', async () => {
    const req = new Request('http://localhost/api/save-rulebook', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('persists PDF content directly to assets/rulebooks/ directory', async () => {
    const dummyPdf = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
    const req = new Request('http://localhost/api/save-rulebook', {
      method: 'POST',
      body: JSON.stringify({ fileName: testFileName, content: dummyPdf }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(fs.existsSync(targetPath)).toBe(true);
    expect(fs.readFileSync(targetPath, 'utf-8')).toBe(dummyPdf);
  });
});
