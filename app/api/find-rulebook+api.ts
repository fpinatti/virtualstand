import fs from 'fs';
import path from 'path';

export interface FindRulebookRequest {
  bggId: number;
  title: string;
}

export interface FindRulebookResponse {
  success: boolean;
  bggId: number;
  fileName?: string;
  relativePath?: string;
  fileSizeBytes?: number;
  message?: string;
  error?: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Curated registry of verified Portuguese rulebooks with direct download links or Google Drive IDs.
 */
const CURATED_REGISTRY: Record<number, { title: string; driveId?: string; directUrl?: string }> = {
  366013: { title: 'Heat: Pedal to the Metal', driveId: '1Y2qE32WG_16rSt7-bxsm8aj7tedeHDjo' },
  414317: { title: 'Harmonies', driveId: '1v18kTdBjarGhAh2ZEAREGZ2L981jEHRR' },
  39856: { title: 'Dixit', driveId: '1Qwkf4FjHHaytacqPsOI1ARbez5F2RQeF' },
  225694: { title: 'Decrypto', driveId: '1LPqu83KcPGwzkq-rX5tVaEb--VtOaN7r' },
  143741: { title: 'BANG! The Dice Game', driveId: '1P3z0smx65BZ2Q-wLPQZ5KXZKUZFEU6Hs' },
  163412: { title: 'Patchwork', driveId: '1Tgzr5DDDCw9eI16WsqOjBRMJc_XcWOS4' },
  180974: { title: 'Potion Explosion', driveId: '1ZTGvlaNCbgnV8V34fViXpy-_ODY1piBu' },
  232043: { title: 'Queendomino', driveId: '1S1J98a5EYGoF_on31vF6XGMXRBVDXRFd' },
  41114: { title: 'The Resistance', driveId: '10vm19Ew-aDVCTYSUA3LKrZLX46o6Ykzv' },
  199561: { title: 'Sagrada', driveId: '1Sjj9deaqk1TuOL1CzmsqbZwMpoNo0QaL' },
  70919: { title: 'Takenoko', driveId: '10yS3XHB4KKqqJIJljiO1C60rFhlhQf92' },
  63268: { title: 'Spot it!', driveId: '1qdcgSqY9Bi7HxDB3-Trp_KA_PPpAVLx_' },
  372: { title: 'Schotten Totten', driveId: '1IOejh17WpVhZmd24GUzS_fYbWSJHwmjX' },
  12942: { title: 'No Thanks!', driveId: '1n6BYxrMX3xw6hDiEOI0ob0vdnpEndE3b' },
  122298: { title: 'Fungi', driveId: '1M7boXD1fe8PC4ysyBh1zkX_Vl5-VZSV5' },
  9674: { title: 'Genial', driveId: '13bKombuL4Ut4KlGixC1k2QhlPhf3zZX2' },
  83195: { title: 'Ghost Blitz', driveId: '13LCCFoTjJZBRqb2xlCn03kymtH_GcD4H' },
  235470: { title: 'Os Incríveis Parques de Miss Liz', driveId: '1JmIbLBTXENm0ZAh9_lixxdkCMnWP9-L9' },
  298572: { title: 'Cosmic Encounter Duel', driveId: '19RphDY1ggNpCBMg7acsllBWFOpctAFF8' },
  241491: { title: 'Who Did It?', driveId: '1Bg5EQHveha492hZtGVv3O2vf2jbqeriw' },
  425428: { title: 'Survive The Island', driveId: '1aey1JxdDmrJsWXdCqGtZVM3-6O6t6N9g' },
  147151: { title: 'Concept', driveId: '1e9fD9RiMSO8tIyPA3XGWMCWtl3SXs3U6' },
  9220: { title: 'Saboteur', driveId: '1NT85VaOk8NbQlFu0PuGoJQTixv6m7YZO' },
  91072: { title: 'Saboteur 2', driveId: '1NT85VaOk8NbQlFu0PuGoJQTixv6m7YZO' },
  256226: { title: 'Azul: Stained Glass of Sintra', driveId: '13eit6HOwpFZr6ILsVHbxFffWD5_FM7PG' },
  332613: { title: 'Azul: Summer Pavilion', driveId: '184aLCkRpJsfFL-Dn2It4gbxE-kl55XG2' },
  3955: { title: 'BANG!', driveId: '1P3z0smx65BZ2Q-wLPQZ5KXZKUZFEU6Hs' },
};

function findInPanda(title: string): string | null {
  try {
    const pandaPath = path.join(process.cwd(), 'assets', 'data', 'panda-rulebooks.json');
    if (!fs.existsSync(pandaPath)) return null;
    const panda = JSON.parse(fs.readFileSync(pandaPath, 'utf8'));
    const norm = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const cleanTitle = norm(title);

    for (const [slug, item] of Object.entries(panda as Record<string, { title: string; driveId: string }>)) {
      const parts = item.title.split('/').map((p) => norm(p));
      if (parts.includes(cleanTitle) || norm(slug) === cleanTitle) {
        return item.driveId;
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as FindRulebookRequest;
    if (!body || !body.bggId || !body.title) {
      return jsonResponse(
        { success: false, error: 'bggId and title are required' },
        400
      );
    }

    const { bggId, title } = body;
    const slug = slugify(title);
    const fileName = `${slug}-regras-ptbr.pdf`;
    const relativePath = `assets/rulebooks/${fileName}`;
    const rulebooksDir = path.join(process.cwd(), 'assets', 'rulebooks');
    const targetFilePath = path.join(rulebooksDir, fileName);

    // 1. If physical file already exists, return immediate success
    if (fs.existsSync(targetFilePath)) {
      const stats = fs.statSync(targetFilePath);
      return jsonResponse({
        success: true,
        bggId,
        fileName,
        relativePath,
        fileSizeBytes: stats.size,
        message: 'File already exists in assets/rulebooks/',
      });
    }

    // 2. Check curated registry
    const curated = CURATED_REGISTRY[bggId];
    let downloadUrl: string | null = null;

    if (curated) {
      if (curated.directUrl) {
        downloadUrl = curated.directUrl;
      } else if (curated.driveId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${curated.driveId}`;
      }
    }

    if (!downloadUrl) {
      const pandaDriveId = findInPanda(title);
      if (pandaDriveId) {
        downloadUrl = `https://drive.google.com/uc?export=download&id=${pandaDriveId}`;
      }
    }

    if (!downloadUrl) {
      return jsonResponse(
        {
          success: false,
          bggId,
          error: `No authentic PT-BR PDF found online for ${title}`,
        },
        404
      );
    }

    // 3. Download verified PDF binary
    const downloadRes = await fetch(downloadUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    if (!downloadRes.ok) {
      return jsonResponse(
        {
          success: false,
          bggId,
          error: `Remote download failed with status ${downloadRes.status}`,
        },
        502
      );
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify PDF header
    if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
      return jsonResponse(
        {
          success: false,
          bggId,
          error: 'Remote file is not a valid PDF document',
        },
        422
      );
    }

    if (!fs.existsSync(rulebooksDir)) {
      fs.mkdirSync(rulebooksDir, { recursive: true });
    }

    fs.writeFileSync(targetFilePath, buffer);

    return jsonResponse({
      success: true,
      bggId,
      fileName,
      relativePath,
      fileSizeBytes: buffer.length,
      message: 'Authentic PT-BR rulebook downloaded and saved successfully',
    });
  } catch (error: any) {
    return jsonResponse(
      { success: false, error: error.message || 'Internal server error' },
      500
    );
  }
}
