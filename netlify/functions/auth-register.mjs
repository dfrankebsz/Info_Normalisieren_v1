import { createUser, json } from "../lib/data.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
  try {
    const { nickname, password } = await req.json();
    const user = await createUser({ nickname, password, role: "student" });
    return json({ ok: true, userId: user.userId }, 201);
  } catch (error) {
    const msg = error?.message || "Registrierung fehlgeschlagen.";
    return json({ error: msg }, /vergeben|Zeichen|Passwort/.test(msg) ? 400 : 500);
  }
};
