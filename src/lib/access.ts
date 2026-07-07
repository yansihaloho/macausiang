export const ACCESS_KEY = "strategi_access";
export const ACCESS_PASSWORD = "an3dis13";

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ACCESS_KEY) === "1";
  } catch {
    return false;
  }
}

export function unlock() {
  try {
    sessionStorage.setItem(ACCESS_KEY, "1");
  } catch {}
}

export function lock() {
  try {
    sessionStorage.removeItem(ACCESS_KEY);
  } catch {}
}