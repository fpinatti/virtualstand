import { MAX_RULEBOOK_SIZE_BYTES } from './rulebook-types';

export { MAX_RULEBOOK_SIZE_BYTES };

export type SizeValidationResult =
  | { ok: true }
  | { ok: false; code: 'EMPTY_FILE' | 'FILE_TOO_LARGE' };

/**
 * Validates that a file's byte size is between 1 byte and 100 MB inclusive.
 */
export function validateFileSize(sizeBytes: number): SizeValidationResult {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, code: 'EMPTY_FILE' };
  }
  if (sizeBytes > MAX_RULEBOOK_SIZE_BYTES) {
    return { ok: false, code: 'FILE_TOO_LARGE' };
  }
  return { ok: true };
}

/**
 * Checks whether the base64-encoded prefix of a file starts with the PDF magic header "%PDF-".
 * In base64, the 5 ASCII bytes "%PDF-" (0x25 0x50 0x44 0x46 0x2D) start with "JVBERi" (specifically "JVBERi0=" for 5 bytes).
 */
export function isPdfMagicHeader(headerBase64: string): boolean {
  if (!headerBase64 || typeof headerBase64 !== 'string') {
    return false;
  }
  return headerBase64.trim().startsWith('JVBERi');
}

/**
 * Strictly validates that a download URL uses HTTPS and has a valid host.
 */
export function validateDownloadUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Normalizes a rulebook display label (1-120 chars), stripping file paths and .pdf extensions.
 */
export function normalizeLabel(explicitLabel?: string, fallbackFileName?: string): string {
  const raw = (explicitLabel && explicitLabel.trim()) || fallbackFileName || '';
  // Strip any directory components for safety
  const baseName = raw.replace(/^.*[/\\]/, '').replace(/\.pdf$/i, '').trim();
  if (!baseName) {
    return 'Manual';
  }
  return baseName.slice(0, 120);
}

