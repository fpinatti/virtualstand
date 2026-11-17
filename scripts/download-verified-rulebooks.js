const fs = require('fs');
const path = require('path');

const verifiedSources = [
  { bggId: 366013, title: 'Heat: Pedal to the Metal', driveId: '1Y2qE32WG_16rSt7-bxsm8aj7tedeHDjo' },
  { bggId: 414317, title: 'Harmonies', driveId: '1v18kTdBjarGhAh2ZEAREGZ2L981jEHRR' },
  { bggId: 39856, title: 'Dixit', driveId: '1Qwkf4FjHHaytacqPsOI1ARbez5F2RQeF' },
  { bggId: 225694, title: 'Decrypto', driveId: '1LPqu83KcPGwzkq-rX5tVaEb--VtOaN7r' },
  { bggId: 143741, title: 'BANG! The Dice Game', driveId: '1P3z0smx65BZ2Q-wLPQZ5KXZKUZFEU6Hs' },
  { bggId: 163412, title: 'Patchwork', driveId: '1Tgzr5DDDCw9eI16WsqOjBRMJc_XcWOS4' },
  { bggId: 180974, title: 'Potion Explosion', driveId: '1ZTGvlaNCbgnV8V34fViXpy-_ODY1piBu' },
  { bggId: 232043, title: 'Queendomino', driveId: '1S1J98a5EYGoF_on31vF6XGMXRBVDXRFd' },
  { bggId: 41114, title: 'The Resistance', driveId: '10vm19Ew-aDVCTYSUA3LKrZLX46o6Ykzv' },
  { bggId: 199561, title: 'Sagrada', driveId: '1Sjj9deaqk1TuOL1CzmsqbZwMpoNo0QaL' },
  { bggId: 70919, title: 'Takenoko', driveId: '10yS3XHB4KKqqJIJljiO1C60rFhlhQf92' },
  { bggId: 63268, title: 'Spot it!', driveId: '1qdcgSqY9Bi7HxDB3-Trp_KA_PPpAVLx_' },
  { bggId: 372, title: 'Schotten Totten', driveId: '1IOejh17WpVhZmd24GUzS_fYbWSJHwmjX' },
  { bggId: 12942, title: 'No Thanks!', driveId: '1n6BYxrMX3xw6hDiEOI0ob0vdnpEndE3b' },
  { bggId: 122298, title: 'Fungi', driveId: '1M7boXD1fe8PC4ysyBh1zkX_Vl5-VZSV5' },
  { bggId: 9674, title: 'Genial', driveId: '13bKombuL4Ut4KlGixC1k2QhlPhf3zZX2' },
  { bggId: 83195, title: 'Ghost Blitz', driveId: '13LCCFoTjJZBRqb2xlCn03kymtH_GcD4H' },
  { bggId: 235470, title: 'Os Incríveis Parques de Miss Liz', driveId: '1JmIbLBTXENm0ZAh9_lixxdkCMnWP9-L9' },
  { bggId: 298572, title: 'Cosmic Encounter Duel', driveId: '19RphDY1ggNpCBMg7acsllBWFOpctAFF8' },
  { bggId: 241491, title: 'Who Did It?', driveId: '1Bg5EQHveha492hZtGVv3O2vf2jbqeriw' },
  { bggId: 425428, title: 'Survive The Island', driveId: '1aey1JxdDmrJsWXdCqGtZVM3-6O6t6N9g' },
  { bggId: 147151, title: 'Concept', driveId: '1e9fD9RiMSO8tIyPA3XGWMCWtl3SXs3U6' }
];

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function downloadRulebook(source) {
  const slug = slugify(source.title);
  const fileName = `${slug}-regras-ptbr.pdf`;
  const targetPath = path.join(__dirname, '..', 'assets', 'rulebooks', fileName);

  if (fs.existsSync(targetPath)) {
    console.log(`[SKIP] Already exists: ${fileName} (${fs.statSync(targetPath).size} bytes)`);
    return { ...source, fileName, size: fs.statSync(targetPath).size, status: 'EXISTS' };
  }

  const url = `https://drive.google.com/uc?export=download&id=${source.driveId}`;
  console.log(`[DOWNLOADING] ${source.title} -> ${fileName}...`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.error(`[ERROR] HTTP ${res.status} for ${source.title}`);
      return { ...source, error: `HTTP ${res.status}` };
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify PDF signature
    if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
      console.error(`[INVALID] Not a PDF: ${source.title}`);
      return { ...source, error: 'NOT_A_PDF' };
    }

    fs.writeFileSync(targetPath, buffer);
    console.log(`[SUCCESS] Saved ${fileName} (${buffer.length} bytes)`);
    return { ...source, fileName, size: buffer.length, status: 'DOWNLOADED' };
  } catch (err) {
    console.error(`[ERROR] Failed ${source.title}:`, err.message);
    return { ...source, error: err.message };
  }
}

async function main() {
  console.log(`Starting download of ${verifiedSources.length} authentic Portuguese rulebooks...`);
  const results = [];
  for (const s of verifiedSources) {
    const res = await downloadRulebook(s);
    results.push(res);
  }

  const successful = results.filter(r => r.status === 'DOWNLOADED' || r.status === 'EXISTS');
  console.log(`\nFinished: ${successful.length}/${verifiedSources.length} rulebooks verified and saved to assets/rulebooks/`);
}

main().catch(console.error);
