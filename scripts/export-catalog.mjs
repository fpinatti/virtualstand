#!/usr/bin/env node

/**
 * CLI Tool: Export/Sync BGG Collection and Assets to physical assets/data/virtualstand-catalog.json
 *
 * Usage:
 *   node scripts/export-catalog.mjs <username>
 * Example:
 *   node scripts/export-catalog.mjs fpinatti
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

async function fetchBggCollection(username) {
  console.log(`Buscando coleção BGG para "${username}"...`);
  const headers = { Accept: 'application/xml', 'User-Agent': 'VirtualStand-CLI/1.0' };
  if (bggToken) {
    headers['Authorization'] = bggToken.startsWith('Bearer ') ? bggToken : `Bearer ${bggToken}`;
  }

  const url = `https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username)}&own=1&stats=1`;
  
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 202) {
      console.log('BGG processando coleção (HTTP 202). Aguardando 3s...');
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
      const minPlayMatch = inner.match(/<stats[^>]*minplaytime="(\d+)"/);
      const maxPlayMatch = inner.match(/<stats[^>]*maxplaytime="(\d+)"/);
      const minPlayersMatch = inner.match(/<stats[^>]*minplayers="(\d+)"/);
      const maxPlayersMatch = inner.match(/<stats[^>]*maxplayers="(\d+)"/);
      const ratingMatch = inner.match(/<rating\s+value="([\d.]+)"/);
      const thumbMatch = inner.match(/<thumbnail>([^<]+)<\/thumbnail>/);
      const imageMatch = inner.match(/<image>([^<]+)<\/image>/);

      const title = nameMatch ? nameMatch[1].trim() : `Game ${bggId}`;
      const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
      const minPlayers = minPlayersMatch ? parseInt(minPlayersMatch[1], 10) : null;
      const maxPlayers = maxPlayersMatch ? parseInt(maxPlayersMatch[1], 10) : null;
      const minPlaytime = minPlayMatch ? parseInt(minPlayMatch[1], 10) : null;
      const maxPlaytime = maxPlayMatch ? parseInt(maxPlayMatch[1], 10) : null;
      const bggRating = ratingMatch && ratingMatch[1] !== 'N/A' ? parseFloat(ratingMatch[1]) : null;
      const thumbnailUrl = thumbMatch ? thumbMatch[1].trim() : null;
      const imageUrl = imageMatch ? imageMatch[1].trim() : null;

      items.push({
        bggId,
        title,
        yearPublished: year,
        minPlayers,
        maxPlayers,
        minPlaytime,
        maxPlaytime,
        bggRating,
        thumbnailUrl,
        imageUrl,
      });
    }
    return items;
  }
  throw new Error('Tempo limite excedido esperando o BGG gerar o XML da coleção.');
}

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.log('\nUso:');
    console.log('  node scripts/export-catalog.mjs <seu_usuario_bgg>\n');
    process.exit(1);
  }

  const catalogFilePath = path.join(projectRoot, 'assets', 'data', 'virtualstand-catalog.json');
  const rulebooksDir = path.join(projectRoot, 'assets', 'rulebooks');

  const rulebookFiles = fs.existsSync(rulebooksDir) ? fs.readdirSync(rulebooksDir) : [];
  const rawGames = await fetchBggCollection(username);

  let existingCatalog = { games: [] };
  if (fs.existsSync(catalogFilePath)) {
    try {
      existingCatalog = JSON.parse(fs.readFileSync(catalogFilePath, 'utf-8'));
    } catch {
      // ignore
    }
  }

  const existingMap = new Map((existingCatalog.games || []).map((g) => [g.bggId, g]));
  const gamesList = [];

  for (const raw of rawGames) {
    const prev = existingMap.get(raw.bggId);
    const slug = slugifyTitle(raw.title);

    // Find any matching rulebook in assets/rulebooks
    const matchingRulebook = rulebookFiles.find(
      (f) =>
        f.toLowerCase().includes(slug) ||
        f.toLowerCase().replace(/[^a-z0-9]/g, '').includes(slug.replace(/[^a-z0-9]/g, ''))
    );

    const rulebooks = prev?.rulebooks && prev.rulebooks.length > 0 ? prev.rulebooks : [];
    if (matchingRulebook && !rulebooks.some((r) => r.relativePath.includes(matchingRulebook))) {
      rulebooks.push({
        label: `${raw.title} - Regras Oficiais (PT-BR)`,
        docType: 'BASE_RULES',
        sourceKind: 'BUNDLED_ASSET',
        relativePath: `assets/rulebooks/${matchingRulebook}`,
        fileSizeBytes: fs.statSync(path.join(rulebooksDir, matchingRulebook)).size,
        md5: `asset-${matchingRulebook}`,
        pageCount: 3,
        status: 'READY',
      });
    }

    gamesList.push({
      bggId: raw.bggId,
      title: raw.title,
      yearPublished: raw.yearPublished,
      minPlayers: raw.minPlayers,
      maxPlayers: raw.maxPlayers,
      minPlaytime: raw.minPlaytime,
      maxPlaytime: raw.maxPlaytime,
      thumbnailUrl: raw.thumbnailUrl,
      imageUrl: raw.imageUrl,
      localThumbnailUri: null,
      localImageUri: null,
      dimensions: prev?.dimensions ?? {
        widthCm: 29.5,
        heightCm: 29.5,
        depthCm: 7.2,
        weightKg: 1.2,
        isEstimated: 1,
      },
      sleeves: prev?.sleeves ?? [],
      rulebooks,
      personalRating: prev?.personalRating ?? null,
      statusOwn: 1,
      bggRating: raw.bggRating,
    });
  }

  const catalog = {
    version: 1,
    exportedAt: new Date().toISOString(),
    totalGames: gamesList.length,
    games: gamesList,
  };

  fs.mkdirSync(path.dirname(catalogFilePath), { recursive: true });
  fs.writeFileSync(catalogFilePath, JSON.stringify(catalog, null, 2), 'utf-8');

  console.log(`\n✓ Catálogo físico exportado com sucesso para:`);
  console.log(`  assets/data/virtualstand-catalog.json`);
  console.log(`  Total de jogos: ${catalog.totalGames}`);
  console.log(`  Agora você pode commitar esse arquivo no Git e seu mobile app terá todos os dados!`);
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
