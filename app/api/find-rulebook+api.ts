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

function cleanStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Words to ignore when matching titles and filenames
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das',
  'expansion', 'expansao', 'edition', 'edicao', 'game', 'jogo',
]);

const DOC_WORDS = new Set([
  'manual', 'regras', 'regra', 'rulebook', 'livro', 'oficial', 'ptbr', 'pt', 'br',
  'traduzidas', 'site', 'grok', 'galapagos', 'galap', 'asmodee', 'copag', 'mandala', 'editora',
]);

const TITLE_ALIASES: Record<string, string[]> = {
  'Who Did It?': ['quem foi', 'who did it'],
  'Tiny Epic Crimes: Kingpins': ['tiny epic crimes chef', 'tiny epic crimes kingpins', 'tiny epic crimes ch'],
  'Tiny Epic Crimes': ['tiny epic crimes tiny epic crimes'],
  'Disney Coup: Truques Traiçoeiros': ['disney coup truques', 'disney coup'],
  'Gwent: The Legendary Card Game': ['gwent', 'gwent o jogo de cartas'],
  'Azul Pavilhão de Verão: Mini': ['azul mini pavilhao', 'azul pavilhao mini'],
  'Azul: Summer Pavilion – Glazed Pavilion': ['glazed pavilion', 'summer pavilion glazed', 'azul summer pavilion glazed'],
  'Saboteur 2 (expansion-only editions)': ['saboteur 2', 'saboteur2'],
  'Heat: Pedal to the Metal': ['heat pedal to the metal', 'heat pedal'],
  'Heat: Heavy Rain': ['heat heavy rain', 'heavy rain'],
  'That\'s Not a Hat: Incognito': ['that s not a hat in', 'that not a hat incognito'],
  'Sky Team: Turbulence': ['sky team turbulenc', 'sky team turbulence'],
  'The Lord of the Rings: Duel for Middle-earth': ['duel for middle earth', 'senhor dos aneis duelo', 'lotr duel'],
  'The Lord of the Rings: The Two Towers – Trick-Taking Game': ['two towers trick', 'duas torres vazas', 'lotr two towers'],
  'Scooby-Doo!: Hotel Mal-Assombrado': ['scooby doo hotel', 'scooby doo'],
  'Kelp: Shark vs Octopus': ['kelp shark vs octopus', 'kelp'],
  'Os Desejos do Sultão: Expansão Viajantes': [
    'miniexpansoes',
    'expansao viaj',
    'os desejos do sulta miniexpansoes',
  ],
  'Os Desejos do Sultão': [
    'os desejos do sulta os desejos do sultao',
    'os desejos do sultao livro',
  ],
  'Infinity Gauntlet: A Love Letter Game': ['love letter manopla', 'manopla do infinito'],
  'Piratas! (3ª Edição)': ['piratas 3 edic', 'piratas 3'],
  'Sanctuary': ['santuario'],
  'Flip 7: With A Vengeance': ['flip 7 with a vengea', 'flip 7 vengea'],
  'Flip 7': ['flip 7 regras oficias grok', 'flip 7'],
};

function getSignificantTokens(str: string): string[] {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

export function findExistingRulebook(gameTitle: string, files: string[]): string | null {
  const cleanTitle = cleanStr(gameTitle);

  // 1. Exact canonical matches ({title}-regras-ptbr.pdf, {title}.pdf)
  for (const f of files) {
    const fBase = f.replace(/\.pdf$/i, '');
    const fClean = cleanStr(fBase);
    if (fClean === cleanTitle + 'regrasptbr' || fClean === cleanTitle) {
      return f;
    }
  }

  // 2. Exact slug matches with hyphens (e.g. wingspan-regras-ptbr.pdf)
  const slugJoined = getSignificantTokens(gameTitle).join('-');
  for (const f of files) {
    if (f.startsWith(slugJoined) || f.startsWith(slugJoined.replace(/-/g, ''))) {
      return f;
    }
  }

  // 3. Known aliases check
  const aliases = TITLE_ALIASES[gameTitle] || [];
  for (const alias of aliases) {
    const cleanAlias = cleanStr(alias);
    for (const f of files) {
      if (cleanStr(f).includes(cleanAlias)) {
        return f;
      }
    }
  }

  // 4. Token-based matching on Ludopedia style filenames (e.g. wingspan_oceania_manual.pdf)
  const titleTokens = getSignificantTokens(gameTitle);
  let bestCandidate: string | null = null;
  let bestScore = -1;

  for (const f of files) {
    const fLower = f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fParts = fLower.replace(/\.pdf$/i, '').split(/[^a-z0-9]+/).filter(Boolean);

    // Extract game-identifying tokens before doc descriptor like "manual", "regras", etc.
    const gameParts: string[] = [];
    for (const p of fParts) {
      if (DOC_WORDS.has(p)) break;
      if (!STOP_WORDS.has(p) && !/^\d+$/.test(p)) {
        gameParts.push(p);
      }
    }

    // Compare gameParts with titleTokens from the beginning
    let matchCount = 0;
    for (let i = 0; i < titleTokens.length; i++) {
      if (i < gameParts.length) {
        const tt = titleTokens[i];
        const gp = gameParts[i];
        if (tt === gp || (tt.startsWith(gp) && gp.length >= 2) || (gp.startsWith(tt) && tt.length >= 2)) {
          matchCount++;
        } else {
          break;
        }
      }
    }

    if (
      matchCount > 0 &&
      (matchCount === titleTokens.length || (gameParts.length > 0 && matchCount === gameParts.length))
    ) {
      const score = matchCount * 10 - Math.abs(gameParts.length - titleTokens.length);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = f;
      }
    }
  }

  return bestCandidate;
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

async function findInLudopedia(title: string): Promise<string | null> {
  const cookie = process.env.LUDOPEDIA_COOKIE;
  if (!cookie) return null;
  const userAgent =
    process.env.LUDOPEDIA_USER_AGENT ||
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  try {
    const searchUrl = `https://ludopedia.com.br/busca?q=${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        Referer: 'https://ludopedia.com.br/',
        Cookie: cookie,
      },
    });
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();
    const gameLinkMatch = searchHtml.match(/href="(https:\/\/ludopedia\.com\.br\/jogo\/[^"#\?]+)"/i);
    if (!gameLinkMatch) return null;

    const gameUrl = gameLinkMatch[1];
    const anexosUrls = [`${gameUrl}?aba=anexos`, `${gameUrl}/anexos`, gameUrl];

    for (const aUrl of anexosUrls) {
      const pageRes = await fetch(aUrl, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: 'https://ludopedia.com.br/',
          Cookie: cookie,
        },
      });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();

      const linkRegex = /href="([^"]*(?:anexo\/download|\/anexo\/|\.pdf)[^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(pageHtml)) !== null) {
        const href = match[1];
        const linkAttrs = match[2];
        const linkText = match[3].replace(/<[^>]+>/g, '').trim();
        const combined = `${href} ${linkAttrs} ${linkText}`.toLowerCase();

        const isRule =
          combined.includes('regra') ||
          combined.includes('manual') ||
          combined.includes('rule') ||
          combined.includes('livro') ||
          combined.includes('.pdf');

        const isNonPortuguese =
          combined.includes('ingles') || combined.includes('english') || combined.includes('espanhol');

        if (isRule && !isNonPortuguese) {
          let downloadUrl = href;
          if (!downloadUrl.startsWith('http')) {
            downloadUrl = `https://ludopedia.com.br${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
          }
          return downloadUrl;
        }
      }
    }
  } catch {
    // Ignore error
  }
  return null;
}

async function searchRulebookWithGemini(title: string): Promise<string | null> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Você é um especialista em jogos de tabuleiro que localiza manuais oficiais em português (PT-BR) em PDF.
Para o jogo de tabuleiro: "${title}" (board game)
Pesquise na internet (em sites como Table Games, Panda Board Games, editoras brasileiras como Galápagos, Devir, PaperGames, Grok Games, MeepleBR ou repositórios públicos como Google Drive, Dropbox ou OneDrive) e encontre a URL de download do manual de regras oficial em português (PT-BR) em formato PDF.
Responda EXCLUSIVAMENTE em formato JSON:
{
  "found": true,
  "downloadUrl": "https://..."
}
ou se não houver PDF oficial disponível:
{
  "found": false
}`,
              },
            ],
          },
        ],
        tools: [{ googleSearch: {} }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed.found && parsed.downloadUrl && parsed.downloadUrl.startsWith('http')) {
      return parsed.downloadUrl;
    }
  } catch {
    // Ignore AI search errors
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
    const rulebooksDir = path.join(process.cwd(), 'assets', 'rulebooks');
    const existingFiles = fs.existsSync(rulebooksDir)
      ? fs.readdirSync(rulebooksDir).filter((f) => f.endsWith('.pdf'))
      : [];

    // 1. If physical file already exists in assets/rulebooks, return immediate success
    const matchedFile = findExistingRulebook(title, existingFiles);
    if (matchedFile) {
      const stats = fs.statSync(path.join(rulebooksDir, matchedFile));
      return jsonResponse({
        success: true,
        bggId,
        fileName: matchedFile,
        relativePath: `assets/rulebooks/${matchedFile}`,
        fileSizeBytes: stats.size,
        message: 'File already exists in assets/rulebooks/',
      });
    }

    const slug = slugify(title);
    const fileName = `${slug}-regras-ptbr.pdf`;
    const relativePath = `assets/rulebooks/${fileName}`;
    const targetFilePath = path.join(rulebooksDir, fileName);

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
      downloadUrl = await findInLudopedia(title);
    }

    if (!downloadUrl) {
      downloadUrl = await searchRulebookWithGemini(title);
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
    const downloadHeaders: Record<string, string> = {
      'User-Agent':
        process.env.LUDOPEDIA_USER_AGENT ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };
    if (downloadUrl.includes('ludopedia.com.br') && process.env.LUDOPEDIA_COOKIE) {
      downloadHeaders['Cookie'] = process.env.LUDOPEDIA_COOKIE;
    }

    const downloadRes = await fetch(downloadUrl, {
      headers: downloadHeaders,
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
