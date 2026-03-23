export function isPocketDisabledForAge(currentTrinketCount: number, hasPocketedThisAge: boolean): boolean {
  return currentTrinketCount !== 1 || hasPocketedThisAge;
}
