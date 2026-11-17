import { POST } from '@/../app/api/find-rulebook+api';
import fs from 'fs';
import path from 'path';

describe('Find Rulebook API Route (app/api/find-rulebook+api.ts)', () => {
  it('returns 400 when missing bggId or title', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({}),
    } as any;

    const res = await POST(mockReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('recognizes existing rulebook in assets/rulebooks/ and returns file info', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        bggId: 366013,
        title: 'Heat: Pedal to the Metal',
      }),
    } as any;

    const res = await POST(mockReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.fileName).toBe('heat-pedal-to-the-metal-regras-ptbr.pdf');
    expect(data.fileSizeBytes).toBeGreaterThan(0);
  });

  it('returns 404 when no authentic rulebook is available for the game', async () => {
    const mockReq = {
      json: jest.fn().mockResolvedValue({
        bggId: 9999999,
        title: 'Unpublished Mysterious Prototype 999',
      }),
    } as any;

    const res = await POST(mockReq);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });
});
