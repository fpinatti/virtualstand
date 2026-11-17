import {
  calculateContrastTextColor,
  getDeterministicColorFromTitle,
  formatSpineTitle,
  resolveWebGlSafeImageUrl,
  spineGeneratorService,
} from '@/services/spine-generator.service';

describe('SpineGeneratorService', () => {
  it('returns high-contrast text color based on background luminance', () => {
    // Dark backgrounds should get white text
    expect(calculateContrastTextColor('#0f172a')).toBe('#ffffff');
    expect(calculateContrastTextColor('#1e1b4b')).toBe('#ffffff');
    expect(calculateContrastTextColor('#000000')).toBe('#ffffff');

    // Light backgrounds should get dark text
    expect(calculateContrastTextColor('#ffffff')).toBe('#0f172a');
    expect(calculateContrastTextColor('#fef08a')).toBe('#0f172a');
    expect(calculateContrastTextColor('#e2e8f0')).toBe('#0f172a');
  });

  it('generates consistent deterministic colors for the same game title', () => {
    const color1 = getDeterministicColorFromTitle('Catan');
    const color2 = getDeterministicColorFromTitle('Catan');
    expect(color1).toBe(color2);

    const carcColor = getDeterministicColorFromTitle('Carcassonne');
    expect(carcColor).not.toBe('');
  });

  it('formats spine titles cleanly, shortening extreme lengths if needed', () => {
    expect(formatSpineTitle('Catan')).toBe('Catan');
    const longTitle = 'The Settlers of Catan: Cities & Knights Expansion 25th Anniversary Edition';
    const formatted = formatSpineTitle(longTitle);
    expect(formatted.length).toBeLessThanOrEqual(50);
  });

  it('safely returns null without throwing when creating spine texture in non-DOM environment', () => {
    const tex = spineGeneratorService.createSpineTexture('Terraforming Mars');
    expect(tex).toBeNull();
  });

  it('wraps remote image URLs with CORS proxy for WebGL compatibility', () => {
    const original = 'https://cf.geekdo-images.com/item/pic12345.jpg';
    const safe = resolveWebGlSafeImageUrl(original);
    expect(safe).toContain('wsrv.nl');
    expect(safe).toContain(encodeURIComponent(original));

    // Keeps local file or existing wsrv.nl unchanged
    expect(resolveWebGlSafeImageUrl('file:///path/to/img.jpg')).toBe('file:///path/to/img.jpg');
    expect(resolveWebGlSafeImageUrl('https://wsrv.nl/?url=test')).toBe('https://wsrv.nl/?url=test');
  });
});
