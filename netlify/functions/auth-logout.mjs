import { parseToken, sessionsStore, json } from "../lib/data.mjs";
export default async (req) => {
  try {
    const parsed = parseToken(req);
    if (parsed) await sessionsStore().delete(parsed.sessionKey).catch(() => {});
    return json({ ok: true });
  } catch {
    return json({ ok: true });
  }
};
