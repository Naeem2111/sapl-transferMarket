export const ROLES = ["Starter", "Rotation", "Both"] as const;
export type Role = (typeof ROLES)[number];
