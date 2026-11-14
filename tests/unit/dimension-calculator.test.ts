import { calculateBoxDimensions } from '@/services/dimension-calculator.service';
import { BggThingVersionRaw } from '@/api/contracts';

describe('Dimension Calculator Service', () => {
  it('uses verified version dimensions when available', () => {
    const versions: BggThingVersionRaw[] = [
      {
        versionId: 101,
        versionName: 'Standard Edition',
        widthCm: 29.5,
        heightCm: 29.5,
        depthCm: 7.2,
        weightKg: 1.1,
      },
    ];

    const result = calculateBoxDimensions(13, versions);

    expect(result.widthCm).toBe(29.5);
    expect(result.heightCm).toBe(29.5);
    expect(result.depthCm).toBe(7.2);
    expect(result.isEstimated).toBe(0);
    expect(result.versionId).toBe(101);
  });

  it('provides standard Euro fallback when version list is empty or dimensions are zero', () => {
    const result = calculateBoxDimensions(822, []);

    expect(result.widthCm).toBe(29.7);
    expect(result.heightCm).toBe(29.7);
    expect(result.depthCm).toBe(7.1);
    expect(result.isEstimated).toBe(1);
    expect(result.versionName).toBe('Standard Euro Box (Estimated)');
  });
});

