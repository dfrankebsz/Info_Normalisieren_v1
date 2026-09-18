import { createUser, createSession, publicProfile, settingsStore, json, deleteUserFully } from "../lib/data.mjs";
import crypto from "node:crypto";

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
  const expected = process.env.TEACHER_SETUP_CODE || "";
  if (!expected) return json({ error: "TEACHER_SETUP_CODE ist in Netlify noch nicht gesetzt." }, 503);
  try {
    const { nickname, password, setupCode } = await req.json();
    if (!safeEqual(setupCode, expected)) return json({ error: "Setup-Code ist nicht korrekt." }, 403);

    const settings = settingsStore();
    const claim = await settings.set("teacher-bootstrap", `pending:${Date.now()}`, { onlyIfNew: true });
    if (!claim.modified) return json({ error: "Der erste Lehrerzugang wurde bereits eingerichtet." }, 409);

    let user = null;
    try {
      user = await createUser({ nickname, password, role: "teacher" });
      await settings.set("teacher-bootstrap", `done:${user.userId}`);
      const session = await createSession(user);
      return json({ ok: true, token: session.token, expiresAt: session.expiresAt, profile: publicProfile(user), state: null }, 201);
    } catch (error) {
      if (user) await deleteUserFully(user.userId).catch(() => {});
      await settings.delete("teacher-bootstrap").catch(() => {});
      throw error;
    }
  } catch (error) {
    return json({ error: error?.message || "Lehrerzugang konnte nicht eingerichtet werden." }, 400);
  }
};
