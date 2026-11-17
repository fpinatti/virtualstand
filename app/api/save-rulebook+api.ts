import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, content } = body;
    if (!fileName || !content) {
      return new Response(JSON.stringify({ error: 'Missing fileName or content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanFileName = path.basename(fileName);
    const targetDir = path.join(process.cwd(), 'assets', 'rulebooks');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, cleanFileName);
    fs.writeFileSync(targetPath, content, 'utf-8');

    return new Response(
      JSON.stringify({ success: true, path: targetPath, fileName: cleanFileName }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
