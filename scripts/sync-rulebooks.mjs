#!/usr/bin/env node

/**
 * CLI Tool: Audit and Match Brazilian Portuguese Official PDFs in assets/rulebooks/
 *
 * Usage:
 *   node scripts/sync-rulebooks.mjs <username>
 * Example:
 *   node scripts/sync-rulebooks.mjs fpinatti
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

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.log('\nUso:');
    console.log('  node scripts/sync-rulebooks.mjs <seu_usuario_bgg>\n');
    process.exit(1);
  }

  const targetDir = path.join(projectRoot, 'assets', 'rulebooks');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const existingFiles = fs.readdirSync(targetDir).filter((f) => f.endsWith('.pdf'));
  console.log(`\nPasta assets/rulebooks/ possui ${existingFiles.length} arquivos PDF oficiais.`);

  const games = await fetchBggCollection(username);
  console.log(`Coleção contém ${games.length} jogos.`);

  const catalogFilePath = path.join(projectRoot, 'assets', 'data', 'virtualstand-catalog.json');
  let catalog = { version: 1, games: [] };
  if (fs.existsSync(catalogFilePath)) {
    try {
      catalog = JSON.parse(fs.readFileSync(catalogFilePath, 'utf-8'));
    } catch {}
  }

  let matchedCount = 0;
  const missingGames = [];

  for (const g of games) {
    const slug = slugifyTitle(g.title);
    const matchedFile = existingFiles.find((f) => {
      const lower = f.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSlug = slug.replace(/[^a-z0-9]/g, '');
      return lower.includes(cleanSlug) || cleanSlug.includes(lower.replace('regrasptbrpdf', ''));
    });

    if (matchedFile) {
      matchedCount++;
    } else {
      missingGames.push(g);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Auditoria de Manuais em assets/rulebooks/`);
  console.log(`========================================`);
  console.log(`✓ Jogos com manual oficial PDF em assets/: ${matchedCount}`);
  console.log(`✗ Jogos pendentes sem manual: ${missingGames.length}`);

  if (missingGames.length > 0) {
    console.log(`\nPara anexar os manuais pendentes, você pode encontrar o PDF oficial no Ludopedia e colocar em assets/rulebooks/ ou anexar pelo app:\n`);
    for (let i = 0; i < Math.min(15, missingGames.length); i++) {
      const mg = missingGames[i];
      const ludopediaUrl = `https://ludopedia.com.br/busca?q=${encodeURIComponent(mg.title)}`;
      console.log(`  • ${mg.title} (${mg.year || 'N/A'})`);
      console.log(`    Buscar na Ludopedia: ${ludopediaUrl}`);
    }
    if (missingGames.length > 15) {
      console.log(`  ... e mais ${missingGames.length - 15} jogos.`);
    }
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
