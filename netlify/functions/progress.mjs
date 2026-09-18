import { requireUser, progressStore, json } from "../lib/data.mjs";
export default async (req) => {
  try {
    const { user } = await requireUser(req);
    const store = progressStore();
    if (req.method === "GET") {
      const data = await store.get(user.userId, { type: "json" });
      return json({ state: data?.state || null, updatedAt: data?.updatedAt || null });
    }
    if (req.method === "PUT" || req.method === "POST") {
      const body = await req.json();
      const state = body?.state;
      if (!state || typeof state !== "object" || Array.isArray(state)) return json({ error: "Ungültiger Lernstand." }, 400);
      const encoded = JSON.stringify(state);
      if (encoded.length > 750000) return json({ error: "Lernstand ist zu groß." }, 413);
      const updatedAt = new Date().toISOString();
      await store.setJSON(user.userId, { state, updatedAt });
      return json({ ok: true, updatedAt });
    }
    return json({ error: "Methode nicht erlaubt." }, 405);
  } catch (error) {
    return json({ error: error?.message || "Lernstand konnte nicht gespeichert werden." }, 401);
  }
};
