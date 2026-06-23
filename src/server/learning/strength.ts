import "server-only";

export type SubjectStrength = {
  avgMastery: number;
  growthTrend: number;
  hasAttempts: boolean;
};

export function computeMasteryAverage(masteries: number[]): number {
  if (masteries.length === 0) return 0;
  const sum = masteries.reduce((acc, m) => acc + m, 0);
  return sum / masteries.length;
}

export function computeGrowthTrend(
  recentMasteries: number[],
  previousMasteries: number[],
): number {
  if (recentMasteries.length === 0 || previousMasteries.length === 0) return 0;
  const recentAvg = computeMasteryAverage(recentMasteries);
  const previousAvg = computeMasteryAverage(previousMasteries);
  return recentAvg - previousAvg;
}

export const MAX_CHALLENGE_SUBJECTS = 4;
export const DAILY_CHALLENGE_SUBJECTS = 2;

export type ProfileForPicking = {
  challengeSubjectIds: string[];
  focusedSubjects: string[];
};

export function pickChallengeSubjectIds(
  profile: ProfileForPicking,
  nationalFallbackIds: string[],
): string[] {
  if (profile.challengeSubjectIds.length > 0) {
    return profile.challengeSubjectIds.slice(0, MAX_CHALLENGE_SUBJECTS);
  }
  if (profile.focusedSubjects.length > 0) {
    return profile.focusedSubjects.slice(0, MAX_CHALLENGE_SUBJECTS);
  }
  return nationalFallbackIds.slice(0, MAX_CHALLENGE_SUBJECTS);
}

export function distributeChallengeSubjects(
  subjectIds: string[],
  total: number,
): string[] {
  if (subjectIds.length === 0) return [];
  return Array.from(
    { length: total },
    (_, i) => subjectIds[i % subjectIds.length],
  );
}
