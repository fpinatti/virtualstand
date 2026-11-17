import fs from 'fs';
import path from 'path';

function resolvePdfFile(request: Request): { error?: string; status?: number; buffer?: Buffer; fileName?: string } {
  const url = new URL(request.url);
  const rawParam = url.searchParams.get('file') || url.searchParams.get('path') || '';
  const fileName = rawParam.split('/').pop()?.split('\\').pop() || '';

  if (!fileName || fileName.includes('..') || !fileName.toLowerCase().endsWith('.pdf')) {
    return { error: 'Invalid file parameter', status: 400 };
  }

  const filePath = path.join(process.cwd(), 'assets', 'rulebooks', fileName);
  if (!fs.existsSync(filePath)) {
    return { error: `Rulebook file ${fileName} not found on server`, status: 404 };
  }

  try {
    const buffer = fs.readFileSync(filePath);
    return { buffer, fileName };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Read error';
    return { error: message, status: 500 };
  }
}

export async function GET(request: Request) {
  const res = resolvePdfFile(request);
  if (res.error || !res.buffer) {
    return new Response(JSON.stringify({ error: res.error }), {
      status: res.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(new Uint8Array(res.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${res.fileName}"`,
      'Content-Length': String(res.buffer.length),
    },
  });
}

export async function HEAD(request: Request) {
  const res = resolvePdfFile(request);
  if (res.error || !res.buffer) {
    return new Response(null, { status: res.status || 500 });
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${res.fileName}"`,
      'Content-Length': String(res.buffer.length),
    },
  });
}
