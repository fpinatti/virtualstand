#!/usr/bin/env node

/**
 * CLI Tool: Synchronize Brazilian Portuguese Rulebooks for BGG Collection into assets/rulebooks/
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

const geminiApiKey =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY;

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

function getUtf8ByteLength(str) {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) bytes += 1;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++;
    } else bytes += 3;
  }
  return bytes;
}

function sanitizePdfLiteral(text) {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function compileRulebookTextToPdf(title, content) {
  const lines = [];
  const rawParagraphs = content.split('\n');

  for (const raw of rawParagraphs) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      lines.push('');
      continue;
    }
    if (trimmed.length <= 70) {
      lines.push(trimmed);
    } else {
      let remaining = trimmed;
      while (remaining.length > 70) {
        let breakIndex = remaining.lastIndexOf(' ', 70);
        if (breakIndex === -1) breakIndex = 70;
        lines.push(remaining.slice(0, breakIndex).trim());
        remaining = remaining.slice(breakIndex).trim();
      }
      if (remaining.length > 0) lines.push(remaining);
    }
  }

  const linesPerPage = 42;
  const pages = [];
  let cur = [];
  for (const line of lines) {
    cur.push(line);
    if (cur.length >= linesPerPage) {
      pages.push(cur);
      cur = [];
    }
  }
  if (cur.length > 0 || pages.length === 0) pages.push(cur);

  const numPages = pages.length;
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const objects = [];

  function addObject(body) {
    objects.push(body);
    return objects.length;
  }

  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject(''); // Placeholder for Pages object (2 0 R)
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const pageObjectIds = [];

  for (let p = 0; p < numPages; p++) {
    const pageLines = pages[p];
    let streamText = 'BT\n';
    streamText += '/F2 16 Tf\n';
    streamText += `50 790 Td\n`;
    streamText += `(${sanitizePdfLiteral(title)}) Tj\n`;
    streamText += '0 -15 Td\n';
    streamText += '/F1 9 Tf\n';
    streamText += `(Guia de Referencia e Regras em Portugues - Pagina ${p + 1} de ${numPages}) Tj\n`;
    streamText += '0 -25 Td\n';

    for (const line of pageLines) {
      if (!line) {
        streamText += '0 -10 Td\n';
        continue;
      }
      const isHeading =
        line.startsWith('#') ||
        line.startsWith('---') ||
        (line.toUpperCase() === line && line.length > 3 && !line.includes('.'));

      if (isHeading) {
        streamText += `/F2 11 Tf\n(${sanitizePdfLiteral(line.replace(/^#+\s*/, '').replace(/^-+\s*/, ''))}) Tj\n0 -15 Td\n`;
      } else {
        streamText += `/F1 10 Tf\n(${sanitizePdfLiteral(line)}) Tj\n0 -14 Td\n`;
      }
    }
    streamText += 'ET';

    const byteLen = getUtf8ByteLength(streamText);
    const contentObjId = addObject(`<< /Length ${byteLen} >>\nstream\n${streamText}\nendstream`);
    const pageObjId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`
    );
    pageObjectIds.push(pageObjId);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${numPages} >>`;

  let offset = pdf.length;
  const offsets = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(offset);
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    pdf += objStr;
    offset += getUtf8ByteLength(objStr);
  }

  const startXref = offset;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;
  return pdf;
}

async function fetchGeminiRules(gameTitle, year) {
  if (!geminiApiKey) {
    throw new Error('Chave EXPO_PUBLIC_GEMINI_API_KEY não configurada no .env');
  }

  const prompt = `Você é um especialista em jogos de tabuleiro.
Escreva um Manual e Guia de Regras Completo em Português do Brasil (PT-BR) para o jogo "${gameTitle}" (${year || 'Ano não informado'}).

Estruture o texto de forma clara com os seguintes tópicos:
# 1. VISÃO GERAL E OBJETIVO
# 2. COMPONENTES PRINCIPAIS
# 3. PREPARAÇÃO DA PARTIDA (SETUP)
# 4. COMO JOGAR (Estrutura do turno, fases e ações possíveis)
# 5. FIM DE JOGO E PONTUAÇÃO FINAL
# 6. DICAS E ESTRATÉGIAS PARA INICIANTES

Use linguagem direta, didática e de fácil leitura.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiApiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2500 },
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Erro Gemini (${resp.status}): ${errText}`);
  }

  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia do Gemini AI');
  return text;
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

  const existingFiles = fs.readdirSync(targetDir);
  console.log(`Pasta assets/rulebooks/ possui ${existingFiles.length} arquivos existentes.`);

  const games = await fetchBggCollection(username);
  console.log(`\nColeção contém ${games.length} jogos.`);

  let newlyGenerated = 0;
  let alreadyExist = 0;

  for (let i = 0; i < games.length; i++) {
    const g = games[i];
    const slug = slugifyTitle(g.title) || `game-${g.bggId}`;
    const expectedFileName = `${slug}-regras-ptbr.pdf`;
    const targetFilePath = path.join(targetDir, expectedFileName);

    // Check if exists either by slug or loose match
    const exists =
      fs.existsSync(targetFilePath) ||
      existingFiles.some((f) => f.toLowerCase().includes(slug) || f.toLowerCase().replace(/[^a-z0-9]/g, '').includes(slug.replace(/[^a-z0-9]/g, '')));

    if (exists) {
      alreadyExist++;
      continue;
    }

    console.log(`[${i + 1}/${games.length}] Gerando manual para: "${g.title}" (${g.year || 'N/A'})...`);
    try {
      const rules = await fetchGeminiRules(g.title, g.year);
      const pdf = compileRulebookTextToPdf(`${g.title} - Regras Oficiais`, rules);
      fs.writeFileSync(targetFilePath, pdf, 'utf-8');
      console.log(`  ✓ Salvo em: assets/rulebooks/${expectedFileName} (${pdf.length} bytes)`);
      newlyGenerated++;
      // Sleep 1s to respect API rate limits
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  ✗ Falha ao gerar regras para "${g.title}":`, err.message);
    }
  }

  console.log(`\n--- Concluído ---`);
  console.log(`Total de jogos: ${games.length}`);
  console.log(`Já possuíam manual em assets/rulebooks: ${alreadyExist}`);
  console.log(`Novos manuais gerados e salvos em assets/rulebooks: ${newlyGenerated}`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
