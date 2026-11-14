import { BggThingVersionRaw } from '@/api/contracts';
import { InsertBoxDimension } from '@/db/schema';

export function calculateBoxDimensions(
  bggId: number,
  versions: BggThingVersionRaw[]
): InsertBoxDimension {
  const now = Date.now();

  // 1. Look for a verified version with valid measurements
  const validVersion = versions.find(
    (v) => (v.widthCm ?? 0) > 0 && (v.heightCm ?? 0) > 0 && (v.depthCm ?? 0) > 0
  );

  if (validVersion && validVersion.widthCm && validVersion.heightCm && validVersion.depthCm) {
    return {
      bggId,
      widthCm: Math.round(validVersion.widthCm * 10) / 10,
      heightCm: Math.round(validVersion.heightCm * 10) / 10,
      depthCm: Math.round(validVersion.depthCm * 10) / 10,
      weightKg: validVersion.weightKg ? Math.round(validVersion.weightKg * 100) / 100 : null,
      versionId: validVersion.versionId,
      versionName: validVersion.versionName ?? 'Verified Physical Edition',
      isEstimated: 0,
      updatedAt: now,
    };
  }

  // 2. Fallback: Standard Euro Box dimensions (e.g. Catan, Ticket to Ride standard size)
  return {
    bggId,
    widthCm: 29.7,
    heightCm: 29.7,
    depthCm: 7.1,
    weightKg: 1.0,
    versionId: null,
    versionName: 'Standard Euro Box (Estimated)',
    isEstimated: 1,
    updatedAt: now,
  };
}

export class DimensionCalculatorService {
  calculate(bggId: number, versions: BggThingVersionRaw[]): InsertBoxDimension {
    return calculateBoxDimensions(bggId, versions);
  }
}

export const dimensionCalculatorService = new DimensionCalculatorService();

