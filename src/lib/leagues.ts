// Example SAPL leagues – can be extended or loaded from config
export const DEFAULT_LEAGUES = [
  "Super League Premiership",
  "Super League Championship",
  "Super League 1 West",
  "Super League 1 East",
  "Super League Conference",
  "Champions League",
  "Europa League",
  "Conference League",
] as const;

export function parseLeagues(json: string): string[] {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.filter((l): l is string => typeof l === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyLeagues(arr: string[]): string {
  return JSON.stringify(arr);
}
