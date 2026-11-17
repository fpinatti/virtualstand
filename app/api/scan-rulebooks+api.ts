import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const targetDir = path.join(process.cwd(), 'assets', 'rulebooks');
    if (!fs.existsSync(targetDir)) {
      return new Response(JSON.stringify({ files: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allFiles = fs.readdirSync(targetDir);
    const pdfFiles = allFiles
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .map((fileName) => {
        const fullPath = path.join(targetDir, fileName);
        const stats = fs.statSync(fullPath);
        return {
          fileName,
          relativePath: `assets/rulebooks/${fileName}`,
          fileSizeBytes: stats.size,
        };
      });

    return new Response(JSON.stringify({ files: pdfFiles, total: pdfFiles.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
