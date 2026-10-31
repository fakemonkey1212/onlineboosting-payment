// Persistent short browser identifier for support-gate rate limiting.
const KEY = "genz_user_id";

export function getUserId(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v || !/^[A-Z0-9]{6}$/.test(v)) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      v = "";
      for (let i = 0; i < 6; i++) v += chars[Math.floor(Math.random() * chars.length)];
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return "TEMPXX";
  }
}
