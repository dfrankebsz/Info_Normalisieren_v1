import { createUser, requireExistingClass, json } from "../lib/data.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "Methode nicht erlaubt." }, 405);
  try { const { nickname, password, className } = await req.json(); const { clean } = await requireExistingClass(className); const user=await createUser({nickname,password,className:clean,role:"student"}); return json({ok:true,userId:user.userId},201); }
  catch(error){const msg=error?.message||"Registrierung fehlgeschlagen.";return json({error:msg},/vergeben|Zeichen|Passwort|Klasse|eingerichtet|ungültig/.test(msg)?400:500);}
};
