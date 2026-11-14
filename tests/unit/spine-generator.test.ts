import {
  calculateContrastTextColor,
  getDeterministicColorFromTitle,
  formatSpineTitle,
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
});

