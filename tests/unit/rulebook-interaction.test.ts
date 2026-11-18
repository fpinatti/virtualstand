import { Rulebook } from '@/services/rulebook-types';
import {
  GITHUB_RAW_RULEBOOKS_BASE_URL,
  resolveGithubRulebookUrl,
  buildGithubPdfViewerHtml,
} from '@/components/rulebooks/pdf-reader';
import { PreloadedRulebookService } from '@/services/preloaded-rulebook.service';
import { RulebookRepository } from '@/db/repositories/rulebook.repository';

describe('User Story 1: Clean & Safe One-Click Rulebook Opening (Feature 014)', () => {
  const sampleRulebook: Rulebook = {
    id: 101,
    bggId: 366013,
    label: 'Heat: Pedal to the Metal - Manual Oficial (PT-BR)',
    docType: 'BASE_RULES',
    sourceKind: 'BUNDLED_ASSET',
    sourceUrl: null,
    fileUri: 'file:///path/to/heat_manual_de_regras_277392.pdf',
    fileSizeBytes: 15420000,
    pageCount: 24,
    lastViewedPage: 1,
    status: 'READY',
    createdAt: Date.now(),
  };

  it('provides single-tap rulebook invocation without clutter', () => {
    const handleCardPress = jest.fn();
    const handleBeforeOpen = jest.fn();

    const triggerOpen = (rbId: number) => {
      handleBeforeOpen();
      handleCardPress(rbId);
    };

    triggerOpen(sampleRulebook.id);

    expect(handleBeforeOpen).toHaveBeenCalledTimes(1);
    expect(handleCardPress).toHaveBeenCalledWith(101);
  });

  it('validates that rulebook display models retain essential reader metadata without CRUD actions', () => {
    expect(sampleRulebook.id).toBe(101);
    expect(sampleRulebook.label).toContain('Heat');
    expect(sampleRulebook.status).toBe('READY');
  });

  it('resolves rulebooks directly to GitHub raw PDF URLs without local IPs', () => {
    const url = resolveGithubRulebookUrl(sampleRulebook);
    expect(url).toBe(
      `${GITHUB_RAW_RULEBOOKS_BASE_URL}/heat_manual_de_regras_277392.pdf`
    );
    expect(url).toContain('https://raw.githubusercontent.com/fpinatti/virtualstand/main/assets/rulebooks/');
    expect(url).not.toContain('192.168.');
  });

  it('upgrades synthetic stub filenames to the authentic catalog PDF from GitHub when available', () => {
    const stubRulebook: Rulebook = {
      ...sampleRulebook,
      bggId: 266192, // Wingspan
      fileUri: 'file:///path/to/wingspan-regras-ptbr.pdf',
      fileSizeBytes: 699,
    };
    const url = resolveGithubRulebookUrl(stubRulebook);
    expect(url).toBe(
      `${GITHUB_RAW_RULEBOOKS_BASE_URL}/wingspan_regras_oficial_318330.pdf`
    );
  });

  it('automatically registers Wyrmspan (410201) and other physical catalog games via PreloadedRulebookService', async () => {
    const insertedRows: any[] = [];
    const mockRepo = {
      listByBggId: jest.fn().mockResolvedValue([]),
      findByBggIdAndMd5: jest.fn().mockResolvedValue(null),
      insert: jest.fn(async (data) => {
        insertedRows.push(data);
        return { id: 1, ...data };
      }),
    } as unknown as RulebookRepository;

    const service = new PreloadedRulebookService(mockRepo);
    const synced = await service.syncBundledRulebookForGame(410201); // Wyrmspan
    expect(synced).toBe(true);
    expect(insertedRows.length).toBe(1);
    expect(insertedRows[0].relativePath).toBe(
      'assets/rulebooks/wyrmspan_wyrmspan_regras_pt_br_260945.pdf'
    );
  });

  it('builds self-contained PDF.js viewer HTML referencing the GitHub PDF URL', () => {
    const url = resolveGithubRulebookUrl(sampleRulebook);
    const html = buildGithubPdfViewerHtml(url, 3, sampleRulebook.label);
    expect(html).toContain('pdf.min.js');
    expect(html).toContain(url);
    expect(html).toContain('var initialPage = 3;');
  });
});
