import * as fs from 'fs';
import * as path from 'path';
import { tokens } from '@/ui/tokens';
import {
  calculateRelativeLuminance,
  calculateContrastRatio,
  auditDesignTokens,
  auditSourceTextForViolations,
} from '@/ui/audit';

function collectTsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTsxFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Impeccable UI Design System & Craft Floor Governance', () => {
  const repoRoot = path.resolve(__dirname, '../..');

  describe('US1: Canonical Impeccable Documents & Tokens', () => {
    it('maintains PRODUCT.md with impeccable:product-schema 1', () => {
      const productPath = path.join(repoRoot, 'PRODUCT.md');
      expect(fs.existsSync(productPath)).toBe(true);
      const content = fs.readFileSync(productPath, 'utf-8');
      expect(content).toContain('<!-- impeccable:product-schema 1 -->');
      expect(content).toContain('## Platform');
      expect(content).toContain('## Users');
      expect(content).toContain('## Product Purpose');
      expect(content).toContain('## Product Principles');
      expect(content).toContain('## Accessibility & Inclusion');
    });

    it('maintains DESIGN.md and .impeccable/design.json with warm tabletop craft tokens', () => {
      const designPath = path.join(repoRoot, 'DESIGN.md');
      const sidecarPath = path.join(repoRoot, '.impeccable', 'design.json');
      expect(fs.existsSync(designPath)).toBe(true);
      expect(fs.existsSync(sidecarPath)).toBe(true);

      const designContent = fs.readFileSync(designPath, 'utf-8');
      expect(designContent).toContain('## Overview');
      expect(designContent).toContain('## Colors');
      expect(designContent).toContain('## Typography');
      expect(designContent).toContain('## Layout');
      expect(designContent).toContain('## Elevation & Depth');
      expect(designContent).toContain('## Shapes');
      expect(designContent).toContain('## Components');
      expect(designContent).toContain("## Do's and Don'ts");

      const sidecar = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
      expect(sidecar.schemaVersion).toBe(2);
      expect(sidecar.extensions.colorMeta['amber-brass'].canonical).toBe('#E5A93C');
      expect(sidecar.extensions.colorMeta['obsidian-canvas'].canonical).toBe('#121316');
    });

    it('exposes complete typed design tokens for colors, typography, spacing, radii, and touch targets', () => {
      expect(tokens.colors.surface.canvas).toBe('#121316');
      expect(tokens.colors.surface.card).toBe('#1B1D22');
      expect(tokens.colors.surface.elevated).toBe('#24272E');
      expect(tokens.colors.accent.primary).toBe('#E5A93C');
      expect(tokens.colors.shelf3d.frameWood).toBe('#1D1815');
      expect(tokens.colors.shelf3d.backingBoard).toBe('#14110F');
      expect(tokens.layout.minTouchTarget).toBeGreaterThanOrEqual(44);
      expect(tokens.spacing.lg).toBe(16);
      expect(tokens.typography.tabularNums).toEqual(['tabular-nums']);
    });

    it('exports all 7 reusable UI primitives from src/ui/index.ts', () => {
      const barrelPath = path.join(repoRoot, 'src', 'ui', 'index.ts');
      const barrelContent = fs.readFileSync(barrelPath, 'utf-8');
      expect(barrelContent).toContain('./primitives/button');
      expect(barrelContent).toContain('./primitives/card');
      expect(barrelContent).toContain('./primitives/badge');
      expect(barrelContent).toContain('./primitives/input');
      expect(barrelContent).toContain('./primitives/section-header');
      expect(barrelContent).toContain('./primitives/empty-state');
      expect(barrelContent).toContain('./primitives/screen-container');
    });
  });

  describe('US3: WCAG 2.1 AA Contrast & Anti-Pattern Audit Engine', () => {
    it('accurately computes relative luminance and contrast ratios', () => {
      expect(calculateRelativeLuminance('#000000')).toBeCloseTo(0, 4);
      expect(calculateRelativeLuminance('#FFFFFF')).toBeCloseTo(1, 4);
      expect(calculateContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
    });

    it('passes all 10 semantic foreground/background WCAG AA contrast pairs', () => {
      const report = auditDesignTokens(tokens);
      expect(report.valid).toBe(true);
      expect(report.violations).toHaveLength(0);
      expect(report.contrastChecks.length).toBeGreaterThanOrEqual(10);
      for (const check of report.contrastChecks) {
        expect(check.passed).toBe(true);
        expect(check.ratio).toBeGreaterThanOrEqual(check.minRequired);
      }
    });

    it('flags banned legacy slate/indigo hex literals when scanning source code', () => {
      const sampleBadCode = `
        const styles = StyleSheet.create({
          box: { backgroundColor: '#0f172a', borderColor: '#6366f1' },
        });
      `;
      const violations = auditSourceTextForViolations('sample.tsx', sampleBadCode);
      expect(violations.length).toBe(2);
      expect(violations[0].code).toBe('FORBIDDEN_CLICHE_COLOR');
    });

    it('verifies zero banned legacy hex literals remain across all screens in app/ and components in src/components/', () => {
      const appDir = path.join(repoRoot, 'app');
      const componentsDir = path.join(repoRoot, 'src', 'components');
      const allFiles = [...collectTsxFiles(appDir), ...collectTsxFiles(componentsDir)];

      expect(allFiles.length).toBeGreaterThanOrEqual(20);

      const allViolations = allFiles.flatMap((filePath) => {
        const source = fs.readFileSync(filePath, 'utf-8');
        const relPath = path.relative(repoRoot, filePath);
        return auditSourceTextForViolations(relPath, source);
      });

      expect(allViolations).toEqual([]);
    });
  });
});
