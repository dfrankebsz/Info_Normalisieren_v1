import { requireUser, publicProfile, json } from "../lib/data.mjs";
export default async (req) => {
  try {
    const { user } = await requireUser(req);
    return json({ profile: publicProfile(user) });
  } catch (error) {
    return json({ error: error?.message || "Nicht angemeldet." }, 401);
  }
};
