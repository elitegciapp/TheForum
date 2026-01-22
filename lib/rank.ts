import { clampTrust, type TrustScore } from './governance';

// Rank badges are derived (never stored) and informational only.
export type Rank = 'Member' | 'Contributor' | 'Trusted' | 'Eligible Moderator';

export function deriveRankFromTrustScore(trustScore: TrustScore): Rank {
  const t = clampTrust(trustScore);

  // V1 trust tiers (rank label only)
  if (t < 25) return 'Member';
  if (t < 50) return 'Contributor';
  if (t < 75) return 'Trusted';
  return 'Eligible Moderator';
}
