// Common FIFA Pro Clubs positions for dropdowns
export const POSITIONS = [
  "ST", "CF", "LW", "RW", "CAM", "CM", "CDM", "LB", "RB", "CB", "LWB", "RWB", "GK",
] as const;

export type Position = (typeof POSITIONS)[number];

export function parsePositions(json: string): string[] {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.filter((p): p is string => typeof p === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyPositions(arr: string[]): string {
  return JSON.stringify(arr);
}
