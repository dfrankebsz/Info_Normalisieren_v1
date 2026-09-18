import { authenticate, createSession, progressStore, publicProfile, json } from "../lib/data.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
  try {
    const { nickname, password } = await req.json();
    const user = await authenticate(nickname, password);
    if (!user) return json({ error: "Nickname oder Passwort ist nicht korrekt." }, 401);
    const session = await createSession(user);
    const progress = await progressStore().get(user.userId, { type: "json" });
    return json({ token: session.token, expiresAt: session.expiresAt, profile: publicProfile(user), state: progress?.state || null, updatedAt: progress?.updatedAt || null });
  } catch (error) {
    return json({ error: error?.message || "Anmeldung fehlgeschlagen." }, 500);
  }
};
