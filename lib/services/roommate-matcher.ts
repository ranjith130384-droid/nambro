export interface RoommatePreferences {
  sleepSchedule: 'EARLY_BIRD' | 'NIGHT_OWL';
  workShift: 'GENERAL_DAY' | 'US_UK_NIGHT' | 'HYBRID';
  acTolerance: 'COLD_18' | 'MODERATE_24' | 'NO_AC';
  studyPreference: 'QUIET_ZONE' | 'CASUAL';
}

/**
 * Deterministic Roommate Compatibility Matcher (100% Free Pure Math)
 */
export function calculateRoommateCompatibility(
  candidate: RoommatePreferences,
  existingRoommate: RoommatePreferences
): number {
  let score = 0;

  // Work Shift Match (35%)
  if (candidate.workShift === existingRoommate.workShift) {
    score += 35;
  } else if (
    (candidate.workShift === 'HYBRID' || existingRoommate.workShift === 'HYBRID') &&
    !(candidate.workShift === 'US_UK_NIGHT' && existingRoommate.workShift === 'GENERAL_DAY')
  ) {
    score += 20;
  }

  // Sleep Schedule Match (25%)
  if (candidate.sleepSchedule === existingRoommate.sleepSchedule) {
    score += 25;
  }

  // AC Tolerance (20%)
  if (candidate.acTolerance === existingRoommate.acTolerance) {
    score += 20;
  } else if (
    (candidate.acTolerance === 'MODERATE_24' && existingRoommate.acTolerance !== 'NO_AC') ||
    (existingRoommate.acTolerance === 'MODERATE_24' && candidate.acTolerance !== 'NO_AC')
  ) {
    score += 10;
  }

  // Study/Noise Preference (20%)
  if (candidate.studyPreference === existingRoommate.studyPreference) {
    score += 20;
  }

  return score;
}
