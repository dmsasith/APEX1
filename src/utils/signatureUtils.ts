import { DigitalSignature } from '../types';

export function matchDigitalSignature(
  signatures: DigitalSignature[] | undefined,
  signerName?: string,
  rolePreference?: 'prepared' | 'approved' | 'reviewed',
  explicitId?: string
): DigitalSignature | undefined {
  if (!signatures || signatures.length === 0) return undefined;
  if (explicitId === '__OFF__') return undefined;
  if (explicitId) {
    const exact = signatures.find((s) => s.id === explicitId);
    if (exact) return exact;
  }

  const clean = (signerName || '')
    .replace(/\s*\(?\s*as\s+super\s+admin\s*\)?/gi, '')
    .trim()
    .toLowerCase();
  if (clean) {
    const byFull = signatures.find((s) => s.name.toLowerCase().includes(clean));
    if (byFull) return byFull;
    const firstToken = clean.split(/\s+/)[0];
    if (firstToken && firstToken.length >= 2) {
      const byFirst = signatures.find((s) => s.name.toLowerCase().includes(firstToken));
      if (byFirst) return byFirst;
    }
  }

  if (rolePreference === 'approved') {
    return signatures[0];
  }
  return signatures[1] || signatures[0];
}
