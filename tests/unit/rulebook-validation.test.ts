import {
  MAX_RULEBOOK_SIZE_BYTES,
  validateFileSize,
  isPdfMagicHeader,
  validateDownloadUrl,
  normalizeLabel,
} from '@/services/rulebook-validation';

describe('Rulebook Validation Pure Functions (US1)', () => {
  describe('validateFileSize', () => {
    it('rejects zero or negative byte files with EMPTY_FILE', () => {
      expect(validateFileSize(0)).toEqual({ ok: false, code: 'EMPTY_FILE' });
      expect(validateFileSize(-10)).toEqual({ ok: false, code: 'EMPTY_FILE' });
    });

    it('accepts files from 1 byte up to 100 MB inclusive', () => {
      expect(validateFileSize(1)).toEqual({ ok: true });
      expect(validateFileSize(MAX_RULEBOOK_SIZE_BYTES)).toEqual({ ok: true });
    });

    it('rejects files exceeding 100 MB with FILE_TOO_LARGE', () => {
      expect(validateFileSize(MAX_RULEBOOK_SIZE_BYTES + 1)).toEqual({
        ok: false,
        code: 'FILE_TOO_LARGE',
      });
    });
  });

  describe('isPdfMagicHeader', () => {
    it('recognizes base64-encoded %PDF- header (JVBERi0=)', () => {
      expect(isPdfMagicHeader('JVBERi0=')).toBe(true);
      expect(isPdfMagicHeader('JVBERi0xLjQK')).toBe(true);
    });

    it('rejects HTML, plain text, or empty headers', () => {
      // "<!DOC" in base64 is PCFET0M=
      expect(isPdfMagicHeader('PCFET0M=')).toBe(false);
      expect(isPdfMagicHeader('')).toBe(false);
    });
  });

  describe('validateDownloadUrl', () => {
    it('accepts valid https URLs', () => {
      expect(validateDownloadUrl('https://cdn.1j1ju.com/medias/catan-rules.pdf')).toBe(true);
    });

    it('rejects http, file, javascript, or malformed URLs', () => {
      expect(validateDownloadUrl('http://example.com/rules.pdf')).toBe(false);
      expect(validateDownloadUrl('file:///etc/passwd')).toBe(false);
      expect(validateDownloadUrl('javascript:alert(1)')).toBe(false);
      expect(validateDownloadUrl('not-a-url')).toBe(false);
    });
  });

  describe('normalizeLabel', () => {
    it('strips .pdf extension and trims whitespace', () => {
      expect(normalizeLabel(undefined, 'Catan_Regras_Base.pdf')).toBe('Catan_Regras_Base');
      expect(normalizeLabel('  Expansão Navegantes  ', 'ignored.pdf')).toBe('Expansão Navegantes');
    });

    it('clamps labels to 120 characters and falls back to Manual when empty', () => {
      const longLabel = 'A'.repeat(150);
      expect(normalizeLabel(longLabel)).toHaveLength(120);
      expect(normalizeLabel('', '')).toBe('Manual');
    });
  });
});

