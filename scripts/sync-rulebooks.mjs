#!/usr/bin/env node

/**
 * CLI Tool: Audit, Download and Sync Brazilian Portuguese Official PDFs in assets/rulebooks/
 *
 * Usage:
 *   node scripts/sync-rulebooks.mjs [username]
 *   npm run sync:rulebooks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables from .env
const envPath = path.join(projectRoot, '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const bggToken =
  process.env.EXPO_PUBLIC_BGG_API_TOKEN ||
  process.env.BGG_API_TOKEN;

const geminiApiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY;

const ludopediaCookie =
  process.env.LUDOPEDIA_COOKIE ||
  null;

const ludopediaUserAgent =
  process.env.LUDOPEDIA_USER_AGENT ||
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function findRulebookOnLudopedia(gameTitle, cookie) {
  if (!cookie) return { skipped: true };

  const headers = {
    'User-Agent': ludopediaUserAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://ludopedia.com.br/',
    'Cookie': cookie,
  };

  try {
    const searchUrl = `https://ludopedia.com.br/busca?q=${encodeURIComponent(gameTitle)}`;
    const searchRes = await fetch(searchUrl, { headers });
    if (searchRes.status === 403 || searchRes.status === 503) {
      const text = await searchRes.text();
      if (text.includes('Just a moment...') || text.includes('challenges.cloudflare.com')) {
        return { blocked: true };
      }
    }
    if (!searchRes.ok) return { notFound: true };

    const searchHtml = await searchRes.text();
    const gameLinkMatch = searchHtml.match(/href="(https:\/\/ludopedia\.com\.br\/jogo\/[^"#\?]+)"/i);
    if (!gameLinkMatch) return { notFound: true };

    const gameUrl = gameLinkMatch[1];
    const anexosUrls = [`${gameUrl}?aba=anexos`, `${gameUrl}/anexos`, gameUrl];

    for (const aUrl of anexosUrls) {
      const pageRes = await fetch(aUrl, { headers });
      if (!pageRes.ok) continue;
      const pageHtml = await pageRes.text();

      const linkRegex = /href="([^"]*(?:anexo\/download|\/anexo\/|\.pdf)[^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi;
      let match;
      const candidates = [];

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
          candidates.push({ href, text: linkText });
        }
      }

      if (candidates.length > 0) {
        let downloadUrl = candidates[0].href;
        if (!downloadUrl.startsWith('http')) {
          downloadUrl = `https://ludopedia.com.br${downloadUrl.startsWith('/') ? '' : '/'}${downloadUrl}`;
        }
        return { found: true, downloadUrl, title: candidates[0].text, gameUrl };
      }
    }
    return { notFound: true, gameUrl };
  } catch {
    return { error: true };
  }
}

async function searchRulebookWithGemini(title, apiKey) {
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

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanStr(s) {
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

const TITLE_ALIASES = {
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
  'Flip 7: With A Vengeance': ['flip 7 with a vengea', 'flip 7 vengea'],
  'Flip 7': ['flip 7 regras oficias grok', 'flip 7'],
};

function getSignificantTokens(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));
}

function findExistingRulebook(gameTitle, files) {
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
  let bestCandidate = null;
  let bestScore = -1;

  for (const f of files) {
    const fLower = f.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const fParts = fLower.replace(/\.pdf$/i, '').split(/[^a-z0-9]+/).filter(Boolean);

    // Extract game-identifying tokens before doc descriptor like "manual", "regras", etc.
    const gameParts = [];
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

function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchBggCollection(username) {
  console.log(`Buscando coleção BGG do usuário "${username}"...`);
  const headers = { Accept: 'application/xml', 'User-Agent': 'VirtualStand-CLI/1.0' };
  if (bggToken) {
    headers['Authorization'] = bggToken.startsWith('Bearer ') ? bggToken : `Bearer ${bggToken}`;
  }

  const url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1`;

  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 202) {
      console.log('BGG está processando a coleção (HTTP 202). Aguardando 3s...');
      await new Promise((r) => setTimeout(r, 3000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Erro BGG (${res.status}): ${res.statusText}`);
    }
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item\s+[^>]*objectid="(\d+)"[^>]*>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const bggId = parseInt(match[1], 10);
      const inner = match[2];
      const nameMatch = inner.match(/<name[^>]*>([^<]+)<\/name>/);
      const yearMatch = inner.match(/<yearpublished>(\d+)<\/yearpublished>/);
      const title = nameMatch ? nameMatch[1].trim() : `Game ${bggId}`;
      const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
      items.push({ bggId, title, year });
    }
    return items;
  }
  throw new Error('Tempo limite excedido esperando o BGG gerar o XML da coleção.');
}

const CURATED_REGISTRY = {
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

function resolveDownloadUrl(bggId, title, pandaMap) {
  if (CURATED_REGISTRY[bggId]) {
    const c = CURATED_REGISTRY[bggId];
    if (c.directUrl) return c.directUrl;
    if (c.driveId) return `https://drive.google.com/uc?export=download&id=${c.driveId}`;
  }

  if (!pandaMap) return null;
  const cleanTitle = norm(title);

  for (const [slug, item] of Object.entries(pandaMap)) {
    const parts = item.title.split('/').map((p) => norm(p));
    if (parts.includes(cleanTitle) || norm(slug) === cleanTitle) {
      return `https://drive.google.com/uc?export=download&id=${item.driveId}`;
    }
  }

  return null;
}

async function downloadRulebookPdf(url, targetPath, cookie = null) {
  let referer = 'https://google.com/';
  try {
    referer = new URL(url).origin + '/';
  } catch {}

  const headers = {
    'User-Agent':
      ludopediaUserAgent ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/pdf,application/octet-stream,*/*',
    'Referer': referer,
  };
  if (cookie && url.includes('ludopedia.com.br')) {
    headers['Cookie'] = cookie;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Download HTTP error ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
    throw new Error('Downloaded file is not a valid PDF (%PDF- header missing)');
  }
  fs.writeFileSync(targetPath, buffer);
  return buffer.length;
}

async function main() {
  const targetDir = path.join(projectRoot, 'assets', 'rulebooks');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const catalogFilePath = path.join(projectRoot, 'assets', 'data', 'virtualstand-catalog.json');
  let catalog = { version: 1, games: [] };
  if (fs.existsSync(catalogFilePath)) {
    try {
      catalog = JSON.parse(fs.readFileSync(catalogFilePath, 'utf-8'));
    } catch {}
  }

  let games = [];
  const username = process.argv[2];
  if (username) {
    games = await fetchBggCollection(username);
  } else if (catalog.games && catalog.games.length > 0) {
    games = catalog.games.map((g) => ({
      bggId: g.bggId,
      title: g.title,
      year: g.yearPublished || null,
    }));
    console.log(`Carregados ${games.length} jogos do catálogo físico (assets/data/virtualstand-catalog.json).`);
  } else {
    console.log('\nUso:');
    console.log('  node scripts/sync-rulebooks.mjs <seu_usuario_bgg>\n');
    process.exit(1);
  }

  const pandaFilePath = path.join(projectRoot, 'assets', 'data', 'panda-rulebooks.json');
  let pandaMap = null;
  if (fs.existsSync(pandaFilePath)) {
    try {
      pandaMap = JSON.parse(fs.readFileSync(pandaFilePath, 'utf-8'));
    } catch {}
  }

  const existingFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.pdf'));
  console.log(`Pasta assets/rulebooks/ possui atualmente ${existingFiles.length} arquivos PDF oficiais.`);
  console.log(`Fontes de busca ativas:`);
  console.log(`  • Registro Curado & Panda Board Games: Ativo (${pandaMap ? Object.keys(pandaMap).length : 0} manuais mapeados)`);
  console.log(`  • Ludopedia: ${ludopediaCookie ? 'Ativo (LUDOPEDIA_COOKIE configurado)' : 'Desativado (sem cookie no .env)'}`);
  console.log(`  • Gemini AI (Search Grounding): ${geminiApiKey ? 'Ativo (chave de API configurada)' : 'Desativado (sem chave)'}\n`);

  let alreadyHad = 0;
  let newlyDownloaded = 0;
  let pendingManual = [];

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const slug = slugifyTitle(g.title);
    const expectedFileName = `${slug}-regras-ptbr.pdf`;
    const expectedFilePath = path.join(targetDir, expectedFileName);

    // 1. Verificar se o PDF já existe na pasta assets/rulebooks/
    const matchedFile = findExistingRulebook(g.title, existingFiles);

    if (matchedFile) {
      console.log(`[${i + 1}/${games.length}] [JÁ EXISTENTE] "${g.title}" -> ${matchedFile}`);
      alreadyHad++;
      continue;
    }

    let downloadUrl = resolveDownloadUrl(g.bggId, g.title, pandaMap);
    let source = 'Registro Curado / Panda DB';

    // 2. Tentar Ludopedia caso configurado
    if (!downloadUrl && ludopediaCookie) {
      process.stdout.write(`[${i + 1}/${games.length}] Buscando na Ludopedia para "${g.title}"... `);
      const ludoResult = await findRulebookOnLudopedia(g.title, ludopediaCookie);
      if (ludoResult.found && ludoResult.downloadUrl) {
        console.log(`encontrado anexos!`);
        downloadUrl = ludoResult.downloadUrl;
        source = 'Ludopedia';
      } else if (ludoResult.blocked) {
        console.log(`bloqueado pelo Cloudflare.`);
      } else if (ludoResult.gameUrl) {
        console.log(`página encontrada, mas sem PDF em anexos.`);
      } else {
        console.log(`não localizado.`);
      }
    }

    // 3. Tentar Gemini AI com Google Search grounding
    if (!downloadUrl && geminiApiKey) {
      process.stdout.write(`[${i + 1}/${games.length}] Buscando via Gemini AI para "${g.title}"... `);
      downloadUrl = await searchRulebookWithGemini(g.title, geminiApiKey);
      if (downloadUrl) {
        console.log(`URL localizada!`);
        source = 'Gemini AI';
      } else {
        console.log(`não localizado.`);
      }
    }

    if (downloadUrl) {
      process.stdout.write(`[${i + 1}/${games.length}] Baixando manual em PT-BR de "${g.title}" (${source})... `);
      try {
        const sizeBytes = await downloadRulebookPdf(downloadUrl, expectedFilePath, ludopediaCookie);
        const mb = (sizeBytes / (1024 * 1024)).toFixed(1);
        console.log(`✓ Salvo (${mb} MB)`);
        newlyDownloaded++;
        existingFiles.push(expectedFileName);
      } catch (err) {
        console.log(`✗ Erro no download: ${err.message}`);
        pendingManual.push(g);
      }
    } else {
      console.log(`[${i + 1}/${games.length}] [PENDENTE] "${g.title}" - sem manual oficial para download automático.`);
      pendingManual.push(g);
    }
  }

  // Synchronize catalog JSON with rulebooks
  if (fs.existsSync(catalogFilePath) && catalog.games) {
    const updatedFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.pdf'));
    for (const g of catalog.games) {
      const matched = findExistingRulebook(g.title, updatedFiles);
      if (matched) {
        const stats = fs.statSync(path.join(targetDir, matched));
        g.rulebooks = [
          {
            id: g.bggId * 10,
            bggId: g.bggId,
            label: `${g.title} - Manual Oficial (PT-BR)`,
            docType: 'BASE_RULES',
            sourceKind: 'BUNDLED_ASSET',
            relativePath: `assets/rulebooks/${matched}`,
            fileSizeBytes: stats.size,
            md5: `asset-${matched}`,
            pageCount: 1,
            lastViewedPage: 1,
            status: 'READY',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      } else {
        g.rulebooks = [];
      }
    }
    fs.writeFileSync(catalogFilePath, JSON.stringify(catalog, null, 2), 'utf-8');
    console.log(`\nCatálogo físico atualizado e sincronizado em assets/data/virtualstand-catalog.json.`);
  }

  console.log(`\n========================================`);
  console.log(`📊 Relatório Final de Manuais`);
  console.log(`========================================`);
  console.log(`✓ Total de jogos analisados: ${games.length}`);
  console.log(`✓ Já possuíam manual em assets/: ${alreadyHad}`);
  console.log(`✓ Baixados com sucesso agora: ${newlyDownloaded}`);
  console.log(`✗ Sem manual oficial para download automático: ${pendingManual.length}`);

  if (pendingManual.length > 0) {
    console.log(`\nJogos pendentes (você pode buscar o PDF oficial no Ludopedia e colocar em assets/rulebooks/):`);
    for (let i = 0; i < Math.min(10, pendingManual.length); i++) {
      const mg = pendingManual[i];
      console.log(`  • ${mg.title} -> https://ludopedia.com.br/busca?q=${encodeURIComponent(mg.title)}`);
    }
    if (pendingManual.length > 10) {
      console.log(`  ... e mais ${pendingManual.length - 10} jogos.`);
    }
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
