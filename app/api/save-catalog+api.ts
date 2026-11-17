import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const catalog = await request.json();
    if (!catalog || typeof catalog !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid catalog payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const targetDir = path.join(process.cwd(), 'assets', 'data');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, 'virtualstand-catalog.json');
    fs.writeFileSync(targetPath, JSON.stringify(catalog, null, 2), 'utf-8');

    return new Response(
      JSON.stringify({
        success: true,
        path: targetPath,
        totalGames: catalog.totalGames ?? catalog.games?.length ?? 0,
      }),
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
