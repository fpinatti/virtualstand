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

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

async function downloadRulebookPdf(url, targetPath) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
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
  console.log(`Pasta assets/rulebooks/ possui atualmente ${existingFiles.length} arquivos PDF oficiais.\n`);

  let alreadyHad = 0;
  let newlyDownloaded = 0;
  let pendingManual = [];

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const slug = slugifyTitle(g.title);
    const expectedFileName = `${slug}-regras-ptbr.pdf`;
    const expectedFilePath = path.join(targetDir, expectedFileName);

    // Check if file exists
    const matchedFile = existingFiles.find((f) => {
      const lower = f.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSlug = slug.replace(/[^a-z0-9]/g, '');
      return lower === cleanSlug || lower === `${cleanSlug}regrasptbrpdf`;
    }) || (fs.existsSync(expectedFilePath) ? expectedFileName : null);

    if (matchedFile) {
      alreadyHad++;
      continue;
    }

    const downloadUrl = resolveDownloadUrl(g.bggId, g.title, pandaMap);
    if (downloadUrl) {
      process.stdout.write(`[${i + 1}/${games.length}] Baixando manual em PT-BR de "${g.title}"... `);
      try {
        const sizeBytes = await downloadRulebookPdf(downloadUrl, expectedFilePath);
        const mb = (sizeBytes / (1024 * 1024)).toFixed(1);
        console.log(`✓ Salvo (${mb} MB)`);
        newlyDownloaded++;
        existingFiles.push(expectedFileName);
      } catch (err) {
        console.log(`✗ Erro: ${err.message}`);
        pendingManual.push(g);
      }
    } else {
      pendingManual.push(g);
    }
  }

  // Synchronize catalog JSON with rulebooks
  if (fs.existsSync(catalogFilePath) && catalog.games) {
    const updatedFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.pdf'));
    for (const g of catalog.games) {
      const slug = slugifyTitle(g.title);
      const matched = updatedFiles.find((f) => {
        const lower = f.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanSlug = slug.replace(/[^a-z0-9]/g, '');
        return lower === cleanSlug || lower === `${cleanSlug}regrasptbrpdf`;
      });
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
