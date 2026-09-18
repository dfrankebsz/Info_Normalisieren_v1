import { requireTeacher, usersStore, progressStore, changePassword, deleteUserFully, revokeUserSessions, json } from "../lib/data.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
  try {
    const { user: teacher } = await requireTeacher(req);
    const body = await req.json();
    const action = body?.action;

    if (action === "list") {
      const store = usersStore();
      const listed = await store.list();
      const users = await Promise.all((listed.blobs || []).map(async b => {
        const u = await store.get(b.key, { type: "json" });
        if (!u) return null;
        const p = await progressStore().get(u.userId, { type: "json" });
        return {
          user_id: u.userId,
          nickname: u.nickname,
          role: u.role,
          created_at: u.createdAt,
          state: p?.state || {},
          updated_at: p?.updatedAt || null
        };
      }));
      users.sort((a,b)=>String(a?.nickname||"").localeCompare(String(b?.nickname||""),"de"));
      return json({ users: users.filter(Boolean) });
    }

    if (action === "resetProgress") {
      if (!body.userId) return json({ error: "Nutzer-ID fehlt." }, 400);
      await progressStore().delete(body.userId);
      return json({ ok: true });
    }

    if (action === "resetAllProgress") {
      await progressStore().deleteAll();
      return json({ ok: true });
    }

    if (action === "resetPassword") {
      await changePassword(body.userId, body.newPassword);
      return json({ ok: true, note: "Alle bestehenden Sitzungen dieses Nutzers wurden beendet." });
    }

    if (action === "deleteUser") {
      if (body.userId === teacher.userId) return json({ error: "Der aktuell angemeldete Lehrer kann sich nicht selbst löschen." }, 400);
      await deleteUserFully(body.userId);
      return json({ ok: true });
    }

    if (action === "logoutUser") {
      await revokeUserSessions(body.userId);
      return json({ ok: true });
    }

    return json({ error: "Unbekannte Aktion." }, 400);
  } catch (error) {
    return json({ error: error?.message || "Aktion fehlgeschlagen." }, /Lehrerberechtigung|Sitzung/.test(error?.message || "") ? 403 : 500);
  }
};
