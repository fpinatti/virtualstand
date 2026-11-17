import {
  compileRulebookTextToPdf,
  getUtf8ByteLength,
} from '@/services/rulebook-ai-generator.service';

describe('RulebookAiGeneratorService & Pure-JS PDF Compiler', () => {
  describe('getUtf8ByteLength', () => {
    it('computes exact byte length without depending on Node.js Buffer', () => {
      expect(getUtf8ByteLength('')).toBe(0);
      expect(getUtf8ByteLength('hello')).toBe(5);
      expect(getUtf8ByteLength('Olá mundo! 🎲')).toBe(16);
      expect(getUtf8ByteLength('A'.repeat(500))).toBe(500);
    });

    it('matches Buffer.byteLength on accented PT-BR characters', () => {
      const sample = 'Regras do Jogo: Preparação, Ação, Pontuação e Fim de Partida (Açúcar & Pão)';
      expect(getUtf8ByteLength(sample)).toBe(Buffer.byteLength(sample, 'utf-8'));
    });
  });

  describe('compileRulebookTextToPdf', () => {
    it('generates a valid %PDF-1.4 file format with catalog, pages, and xref table', () => {
      const title = 'Catan';
      const text = `# VISÃO GERAL
Catan é um clássico jogo de estratégia e negociação.

# PREPARAÇÃO
Monte o tabuleiro com os hexágonos e números. Distribua duas aldeias e duas estradas.

# COMO JOGAR
Em cada turno, role 2 dados, colete recursos e negocie com outros jogadores.`;

      const pdf = compileRulebookTextToPdf(title, text);

      expect(pdf.startsWith('%PDF-1.4')).toBe(true);
      expect(pdf).toContain('/Type /Catalog');
      expect(pdf).toContain('/Type /Pages');
      expect(pdf).toContain('/Type /Page');
      expect(pdf).toContain('/Font');
      expect(pdf).toContain('xref');
      expect(pdf).toContain('%%EOF');
      expect(pdf).toContain('trailer');
    });

    it('handles long multi-page text cleanly without errors', () => {
      const title = 'Terraforming Mars';
      const text = Array(150)
        .fill('Esta é uma linha detalhada de regras para testar a paginação automática.')
        .join('\n');

      const pdf = compileRulebookTextToPdf(title, text);
      expect(pdf.startsWith('%PDF-1.4')).toBe(true);
      expect(pdf).toContain('/Count');
      expect(pdf).toContain('%%EOF');
    });
  });
});
